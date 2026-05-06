-- ============================================================
-- 1. Hype dedup (one per user per item)
-- ============================================================
DELETE FROM public.post_hypes a USING public.post_hypes b
  WHERE a.ctid < b.ctid AND a.post_id = b.post_id AND a.sender_talent_id = b.sender_talent_id;
DELETE FROM public.content_hypes a USING public.content_hypes b
  WHERE a.ctid < b.ctid AND a.content_type = b.content_type AND a.content_id = b.content_id AND a.sender_talent_id = b.sender_talent_id;

CREATE UNIQUE INDEX IF NOT EXISTS post_hypes_unique_per_sender ON public.post_hypes(post_id, sender_talent_id);
CREATE UNIQUE INDEX IF NOT EXISTS content_hypes_unique_per_sender ON public.content_hypes(content_type, content_id, sender_talent_id);

-- Wrap hype_post to emit friendly error on duplicate
CREATE OR REPLACE FUNCTION public.hype_post(_post_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_sender uuid; v_recipient uuid; v_author_user uuid;
  v_bal numeric; v_earned numeric; v_bonus numeric; v_take numeric;
BEGIN
  SELECT id INTO v_sender FROM public.talents WHERE user_id = auth.uid();
  IF v_sender IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT author_user_id INTO v_author_user FROM public.feed_posts WHERE id = _post_id;
  IF v_author_user IS NULL THEN RAISE EXCEPTION 'POST_NOT_FOUND'; END IF;

  SELECT id INTO v_recipient FROM public.talents WHERE user_id = v_author_user;
  IF v_recipient IS NULL THEN RAISE EXCEPTION 'AUTHOR_NOT_TALENT'; END IF;
  IF v_recipient = v_sender THEN RAISE EXCEPTION 'CANNOT_HYPE_SELF'; END IF;

  IF EXISTS(SELECT 1 FROM public.post_hypes WHERE post_id=_post_id AND sender_talent_id=v_sender) THEN
    RAISE EXCEPTION 'ALREADY_HYPED';
  END IF;

  SELECT balance, earned_balance, contact_bonus_balance INTO v_bal, v_earned, v_bonus
    FROM public.talent_credits WHERE talent_id = v_sender FOR UPDATE;
  IF COALESCE(v_bal,0)+COALESCE(v_earned,0)+COALESCE(v_bonus,0) < 1 THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;

  IF COALESCE(v_bonus,0) >= 1 THEN
    UPDATE public.talent_credits SET contact_bonus_balance = contact_bonus_balance - 1, updated_at=now() WHERE talent_id=v_sender;
  ELSIF COALESCE(v_bal,0) >= 1 THEN
    UPDATE public.talent_credits SET balance = balance - 1, updated_at=now() WHERE talent_id=v_sender;
  ELSE
    UPDATE public.talent_credits SET earned_balance = earned_balance - 1, updated_at=now() WHERE talent_id=v_sender;
  END IF;

  v_take := 0.8;
  INSERT INTO public.talent_credits(talent_id, balance, earned_balance, contact_bonus_balance)
    VALUES (v_recipient, 0, v_take, 0)
    ON CONFLICT (talent_id) DO UPDATE
      SET earned_balance = public.talent_credits.earned_balance + v_take, updated_at = now();

  INSERT INTO public.credit_transactions(talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, source, is_earned)
    VALUES
      (v_sender, -1, NULL, 'spend', 'hype', _post_id, 'Hyped a post', 'hype_sent', false),
      (v_recipient, v_take, NULL, 'earn', 'hype', _post_id, 'Received Hype on post', 'hype_received', true);

  INSERT INTO public.post_hypes(post_id, sender_talent_id, recipient_talent_id) VALUES (_post_id, v_sender, v_recipient);
  UPDATE public.feed_posts SET hype_count = hype_count + 1 WHERE id = _post_id;
  RETURN jsonb_build_object('ok', true, 'post_id', _post_id);
END $function$;

-- ============================================================
-- 2. notification_preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  channel text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(talent_id, channel)
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.notification_preferences FOR SELECT
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Users upsert own prefs" ON public.notification_preferences FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Users update own prefs" ON public.notification_preferences FOR UPDATE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));
CREATE POLICY "Users delete own prefs" ON public.notification_preferences FOR DELETE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- ============================================================
-- 3. AI General notification helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_talent_from_ai_general(
  _talent_id uuid, _type text, _title text, _message text, _link text, _icon text DEFAULT 'bell'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled boolean;
  v_existing uuid;
BEGIN
  IF _talent_id IS NULL THEN RETURN; END IF;
  SELECT enabled INTO v_enabled FROM public.notification_preferences
    WHERE talent_id = _talent_id AND channel = _type LIMIT 1;
  IF v_enabled IS FALSE THEN RETURN; END IF;

  -- Dedup last 60s same type+link
  SELECT id INTO v_existing FROM public.notifications
    WHERE talent_id = _talent_id AND type = _type AND COALESCE(link,'') = COALESCE(_link,'')
      AND is_read = false AND created_at > now() - interval '60 seconds' LIMIT 1;
  IF v_existing IS NOT NULL THEN
    UPDATE public.notifications SET title = _title, message = _message, created_at = now() WHERE id = v_existing;
    RETURN;
  END IF;

  INSERT INTO public.notifications(talent_id, type, title, message, link, icon)
    VALUES (_talent_id, _type, _title, _message, _link, _icon);
END $$;

-- Allow this function to be called from triggers regardless of caller RLS
GRANT EXECUTE ON FUNCTION public.notify_talent_from_ai_general(uuid,text,text,text,text,text) TO authenticated, anon;

-- ============================================================
-- 4. Triggers
-- ============================================================
-- Post hype → notify post author
CREATE OR REPLACE FUNCTION public.tg_notify_post_hype() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sender_name text; v_link text;
BEGIN
  IF NEW.recipient_talent_id = NEW.sender_talent_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name FROM public.talents WHERE id = NEW.sender_talent_id;
  v_link := '/app/feed/post/' || NEW.post_id::text;
  PERFORM public.notify_talent_from_ai_general(
    NEW.recipient_talent_id, 'feed_hype',
    v_sender_name || ' hyped your post',
    'You earned +0.8 credits from this Hype.',
    v_link, 'flame'
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_post_hype ON public.post_hypes;
CREATE TRIGGER trg_notify_post_hype AFTER INSERT ON public.post_hypes
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_post_hype();

-- Content hype (course/video/blog) → notify owner if resolvable
CREATE OR REPLACE FUNCTION public.tg_notify_content_hype() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner_user uuid; v_owner_talent uuid; v_sender_name text; v_link text; v_label text;
BEGIN
  IF NEW.content_type = 'post' THEN RETURN NEW; END IF;

  IF NEW.content_type IN ('course','video') THEN
    SELECT created_by INTO v_owner_user FROM public.content WHERE id = NEW.content_id;
    v_link := '/app/' || (CASE WHEN NEW.content_type='course' THEN 'courses/' ELSE 'videos/' END) || NEW.content_id::text;
    v_label := NEW.content_type;
  ELSIF NEW.content_type = 'blog' THEN
    SELECT author_id INTO v_owner_user FROM public.blog_posts WHERE id = NEW.content_id;
    v_link := '/app/blog/' || NEW.content_id::text;
    v_label := 'article';
  END IF;

  IF v_owner_user IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO v_owner_talent FROM public.talents WHERE user_id = v_owner_user;
  IF v_owner_talent IS NULL OR v_owner_talent = NEW.sender_talent_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name FROM public.talents WHERE id = NEW.sender_talent_id;
  PERFORM public.notify_talent_from_ai_general(
    v_owner_talent, 'feed_hype',
    v_sender_name || ' hyped your ' || v_label,
    'A learner showed appreciation for your ' || v_label || '.',
    v_link, 'flame'
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_content_hype ON public.content_hypes;
CREATE TRIGGER trg_notify_content_hype AFTER INSERT ON public.content_hypes
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_content_hype();

-- Post comment → notify post author
CREATE OR REPLACE FUNCTION public.tg_notify_post_comment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_author_talent uuid; v_author_user uuid; v_sender_name text; v_link text; v_excerpt text;
BEGIN
  SELECT author_user_id INTO v_author_user FROM public.feed_posts WHERE id = NEW.post_id;
  IF v_author_user IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO v_author_talent FROM public.talents WHERE user_id = v_author_user;
  IF v_author_talent IS NULL OR v_author_talent = NEW.author_talent_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name FROM public.talents WHERE id = NEW.author_talent_id;
  v_link := '/app/feed/post/' || NEW.post_id::text;
  v_excerpt := left(NEW.body, 140);
  PERFORM public.notify_talent_from_ai_general(
    v_author_talent, 'feed_comment',
    v_sender_name || ' commented on your post',
    v_excerpt, v_link, 'message-square'
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_post_comment ON public.post_comments;
CREATE TRIGGER trg_notify_post_comment AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_post_comment();

-- ============================================================
-- 5. Realtime publication
-- ============================================================
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
