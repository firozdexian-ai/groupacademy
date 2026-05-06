-- Universal Hype: polymorphic hype table + RPC + counters
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS hype_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS hype_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.content_hypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('post','course','video','blog')),
  content_id uuid NOT NULL,
  credits numeric(12,1) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_hypes_target_idx ON public.content_hypes (content_type, content_id);
CREATE INDEX IF NOT EXISTS content_hypes_sender_idx ON public.content_hypes (sender_talent_id);

ALTER TABLE public.content_hypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can view hypes"
  ON public.content_hypes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Senders can see their own hypes"
  ON public.content_hypes FOR SELECT TO authenticated
  USING (sender_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Universal RPC. For 'post' it routes to existing hype_post (preserves 80/20 to creator).
-- For other content types, debits 1 credit, increments counter, no creator wallet split (goes to platform).
CREATE OR REPLACE FUNCTION public.hype_content(_content_type text, _content_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid;
  v_bal numeric; v_earned numeric; v_bonus numeric;
  v_exists boolean;
BEGIN
  IF _content_type NOT IN ('post','course','video','blog') THEN
    RAISE EXCEPTION 'INVALID_CONTENT_TYPE';
  END IF;

  -- Posts: delegate to existing function that handles 80/20 split to creator
  IF _content_type = 'post' THEN
    RETURN public.hype_post(_content_id);
  END IF;

  SELECT id INTO v_sender FROM public.talents WHERE user_id = auth.uid();
  IF v_sender IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  -- Verify content exists
  IF _content_type IN ('course','video') THEN
    SELECT EXISTS(SELECT 1 FROM public.content WHERE id = _content_id) INTO v_exists;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.blog_posts WHERE id = _content_id) INTO v_exists;
  END IF;
  IF NOT v_exists THEN RAISE EXCEPTION 'CONTENT_NOT_FOUND'; END IF;

  -- Debit sender 1 credit (bonus -> balance -> earned)
  SELECT balance, earned_balance, contact_bonus_balance
    INTO v_bal, v_earned, v_bonus
  FROM public.talent_credits WHERE talent_id = v_sender FOR UPDATE;

  IF COALESCE(v_bal,0)+COALESCE(v_earned,0)+COALESCE(v_bonus,0) < 1 THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  IF COALESCE(v_bonus,0) >= 1 THEN
    UPDATE public.talent_credits SET contact_bonus_balance = contact_bonus_balance - 1, updated_at=now() WHERE talent_id=v_sender;
  ELSIF COALESCE(v_bal,0) >= 1 THEN
    UPDATE public.talent_credits SET balance = balance - 1, updated_at=now() WHERE talent_id=v_sender;
  ELSE
    UPDATE public.talent_credits SET earned_balance = earned_balance - 1, updated_at=now() WHERE talent_id=v_sender;
  END IF;

  -- Ledger entry
  INSERT INTO public.credit_transactions(talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, source, is_earned)
    VALUES (v_sender, -1, NULL, 'spend', 'hype', _content_id,
            'Hyped a ' || _content_type, 'hype_sent', false);

  -- Record + counter
  INSERT INTO public.content_hypes(sender_talent_id, content_type, content_id) VALUES (v_sender, _content_type, _content_id);

  IF _content_type IN ('course','video') THEN
    UPDATE public.content SET hype_count = COALESCE(hype_count,0) + 1 WHERE id = _content_id;
  ELSE
    UPDATE public.blog_posts SET hype_count = COALESCE(hype_count,0) + 1 WHERE id = _content_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'content_type', _content_type, 'content_id', _content_id);
END $$;

-- Seed default profile card theme if none exist
INSERT INTO public.profile_card_themes (name, media_type, gradient_css, overlay_opacity, text_color, priority, is_active)
SELECT 'Default — Tech Blue Glow',
       'gradient',
       'linear-gradient(135deg, hsl(212 75% 45%) 0%, hsl(184 75% 50%) 100%)',
       0.35,
       'light',
       0,
       true
WHERE NOT EXISTS (SELECT 1 FROM public.profile_card_themes);
