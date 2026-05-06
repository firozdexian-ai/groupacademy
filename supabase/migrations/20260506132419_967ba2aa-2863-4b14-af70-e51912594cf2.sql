
CREATE TABLE IF NOT EXISTS public.post_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  viewer_talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  surface text NOT NULL DEFAULT 'feed' CHECK (surface IN ('feed','profile','post_detail','share_link','search')),
  created_at timestamptz NOT NULL DEFAULT now(),
  day_bucket date GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED
);
CREATE INDEX IF NOT EXISTS idx_post_impressions_post ON public.post_impressions(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_impressions_viewer ON public.post_impressions(viewer_talent_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_post_impressions_daily
  ON public.post_impressions(post_id, viewer_talent_id, day_bucket)
  WHERE viewer_talent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  sharer_talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'copy_link' CHECK (channel IN ('copy_link','whatsapp','facebook','linkedin','twitter','native','email','other')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_shares_post ON public.post_shares(post_id, created_at DESC);

ALTER TABLE public.post_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_impressions_insert_self" ON public.post_impressions;
CREATE POLICY "post_impressions_insert_self" ON public.post_impressions
  FOR INSERT TO authenticated
  WITH CHECK (viewer_talent_id IS NULL OR viewer_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "post_impressions_select_author" ON public.post_impressions;
CREATE POLICY "post_impressions_select_author" ON public.post_impressions
  FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM public.feed_posts WHERE talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "post_shares_insert_self" ON public.post_shares;
CREATE POLICY "post_shares_insert_self" ON public.post_shares
  FOR INSERT TO authenticated
  WITH CHECK (sharer_talent_id IS NULL OR sharer_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "post_shares_select_author" ON public.post_shares;
CREATE POLICY "post_shares_select_author" ON public.post_shares
  FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM public.feed_posts WHERE talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS impression_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count integer NOT NULL DEFAULT 0;

UPDATE public.feed_posts fp SET
  comment_count = COALESCE((SELECT count(*) FROM public.post_comments c WHERE c.post_id = fp.id),0),
  save_count = COALESCE((SELECT count(*) FROM public.saved_items s WHERE s.item_id = fp.id::text AND s.item_type = 'post'),0);

CREATE OR REPLACE FUNCTION public.tg_bump_post_impression() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.feed_posts SET impression_count = impression_count + 1 WHERE id = NEW.post_id; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_bump_post_impression ON public.post_impressions;
CREATE TRIGGER trg_bump_post_impression AFTER INSERT ON public.post_impressions
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_post_impression();

CREATE OR REPLACE FUNCTION public.tg_bump_post_share() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.feed_posts SET share_count = share_count + 1 WHERE id = NEW.post_id; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_bump_post_share ON public.post_shares;
CREATE TRIGGER trg_bump_post_share AFTER INSERT ON public.post_shares
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_post_share();

CREATE OR REPLACE FUNCTION public.tg_bump_post_comment_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.feed_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_bump_post_comment_count ON public.post_comments;
CREATE TRIGGER trg_bump_post_comment_count AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_post_comment_count();

CREATE OR REPLACE FUNCTION public.tg_bump_post_save_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid uuid;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.item_type = 'post' THEN
    BEGIN v_pid := NEW.item_id::uuid; UPDATE public.feed_posts SET save_count = save_count + 1 WHERE id = v_pid; EXCEPTION WHEN others THEN NULL; END;
  ELSIF TG_OP = 'DELETE' AND OLD.item_type = 'post' THEN
    BEGIN v_pid := OLD.item_id::uuid; UPDATE public.feed_posts SET save_count = GREATEST(0, save_count - 1) WHERE id = v_pid; EXCEPTION WHEN others THEN NULL; END;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_bump_post_save_count ON public.saved_items;
CREATE TRIGGER trg_bump_post_save_count AFTER INSERT OR DELETE ON public.saved_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_post_save_count();

CREATE OR REPLACE FUNCTION public.record_impression(_post_id uuid, _surface text DEFAULT 'feed')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_viewer uuid; v_author uuid;
BEGIN
  SELECT id INTO v_viewer FROM public.talents WHERE user_id = auth.uid();
  SELECT talent_id INTO v_author FROM public.feed_posts WHERE id = _post_id;
  IF v_viewer IS NOT NULL AND v_viewer = v_author THEN RETURN; END IF;
  BEGIN
    INSERT INTO public.post_impressions(post_id, viewer_talent_id, surface)
    VALUES (_post_id, v_viewer, COALESCE(_surface,'feed'));
  EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;

CREATE OR REPLACE FUNCTION public.record_share(_post_id uuid, _channel text DEFAULT 'copy_link')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sharer uuid;
BEGIN
  SELECT id INTO v_sharer FROM public.talents WHERE user_id = auth.uid();
  INSERT INTO public.post_shares(post_id, sharer_talent_id, channel)
  VALUES (_post_id, v_sharer, COALESCE(_channel,'copy_link'));
END $$;

CREATE OR REPLACE FUNCTION public.get_creator_scorecard(_talent_id uuid, _days int DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller uuid;
  v_now timestamptz := now();
  v_cur_start timestamptz := v_now - (_days || ' days')::interval;
  v_prev_start timestamptz := v_now - ((_days*2) || ' days')::interval;
  result jsonb;
BEGIN
  SELECT id INTO v_caller FROM public.talents WHERE user_id = auth.uid();
  IF v_caller IS NULL OR (v_caller <> _talent_id AND NOT public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  WITH posts AS (SELECT id FROM public.feed_posts WHERE talent_id = _talent_id),
  cur AS (
    SELECT
      COALESCE((SELECT count(*) FROM public.post_impressions i JOIN posts p ON p.id=i.post_id WHERE i.created_at >= v_cur_start),0) AS impressions,
      COALESCE((SELECT count(*) FROM public.post_hypes h JOIN posts p ON p.id=h.post_id WHERE h.created_at >= v_cur_start),0) AS hypes,
      COALESCE((SELECT sum(creator_share)::numeric FROM public.post_hypes h JOIN posts p ON p.id=h.post_id WHERE h.created_at >= v_cur_start),0) AS credits_earned,
      COALESCE((SELECT count(*) FROM public.post_comments c JOIN posts p ON p.id=c.post_id WHERE c.created_at >= v_cur_start),0) AS comments,
      COALESCE((SELECT count(*) FROM public.saved_items s JOIN posts p ON p.id::text=s.item_id WHERE s.item_type='post' AND s.saved_at >= v_cur_start),0) AS saves,
      COALESCE((SELECT count(*) FROM public.post_shares sh JOIN posts p ON p.id=sh.post_id WHERE sh.created_at >= v_cur_start),0) AS shares
  ),
  prev AS (
    SELECT
      COALESCE((SELECT count(*) FROM public.post_impressions i JOIN posts p ON p.id=i.post_id WHERE i.created_at >= v_prev_start AND i.created_at < v_cur_start),0) AS impressions,
      COALESCE((SELECT count(*) FROM public.post_hypes h JOIN posts p ON p.id=h.post_id WHERE h.created_at >= v_prev_start AND h.created_at < v_cur_start),0) AS hypes,
      COALESCE((SELECT sum(creator_share)::numeric FROM public.post_hypes h JOIN posts p ON p.id=h.post_id WHERE h.created_at >= v_prev_start AND h.created_at < v_cur_start),0) AS credits_earned,
      COALESCE((SELECT count(*) FROM public.post_comments c JOIN posts p ON p.id=c.post_id WHERE c.created_at >= v_prev_start AND c.created_at < v_cur_start),0) AS comments,
      COALESCE((SELECT count(*) FROM public.saved_items s JOIN posts p ON p.id::text=s.item_id WHERE s.item_type='post' AND s.saved_at >= v_prev_start AND s.saved_at < v_cur_start),0) AS saves,
      COALESCE((SELECT count(*) FROM public.post_shares sh JOIN posts p ON p.id=sh.post_id WHERE sh.created_at >= v_prev_start AND sh.created_at < v_cur_start),0) AS shares
  )
  SELECT jsonb_build_object('days',_days,'current',row_to_json(cur.*),'previous',row_to_json(prev.*),'post_count',(SELECT count(*) FROM posts))
  INTO result FROM cur, prev;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_creator_top_posts(_talent_id uuid, _days int DEFAULT 30, _limit int DEFAULT 20)
RETURNS TABLE(id uuid, snippet text, created_at timestamptz, impression_count int, hype_count int, comment_count int, save_count int, share_count int, credits_earned numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller uuid; v_since timestamptz := now() - (_days || ' days')::interval;
BEGIN
  SELECT id INTO v_caller FROM public.talents WHERE user_id = auth.uid();
  IF v_caller IS NULL OR (v_caller <> _talent_id AND NOT public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  RETURN QUERY
  SELECT fp.id, LEFT(fp.text_content, 80), fp.created_at,
    fp.impression_count, fp.hype_count, fp.comment_count, fp.save_count, fp.share_count,
    COALESCE((SELECT sum(creator_share)::numeric FROM public.post_hypes h WHERE h.post_id = fp.id),0)
  FROM public.feed_posts fp
  WHERE fp.talent_id = _talent_id AND fp.created_at >= v_since
  ORDER BY fp.impression_count DESC, fp.hype_count DESC, fp.created_at DESC
  LIMIT _limit;
END $$;

CREATE OR REPLACE FUNCTION public.get_post_insights(_post_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller uuid; v_author uuid; v_since timestamptz := now() - interval '7 days'; result jsonb;
BEGIN
  SELECT id INTO v_caller FROM public.talents WHERE user_id = auth.uid();
  SELECT talent_id INTO v_author FROM public.feed_posts WHERE id = _post_id;
  IF v_caller IS NULL OR (v_caller <> v_author AND NOT public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  SELECT jsonb_build_object(
    'totals',(SELECT row_to_json(t) FROM (SELECT impression_count,hype_count,comment_count,save_count,share_count FROM public.feed_posts WHERE id=_post_id) t),
    'credits_earned',COALESCE((SELECT sum(creator_share)::numeric FROM public.post_hypes WHERE post_id=_post_id),0),
    'daily',(SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.day),'[]'::jsonb) FROM (
      SELECT date_trunc('day', gs)::date AS day,
        (SELECT count(*) FROM public.post_impressions WHERE post_id=_post_id AND date_trunc('day',created_at)=date_trunc('day',gs)) AS impressions,
        (SELECT count(*) FROM public.post_hypes WHERE post_id=_post_id AND date_trunc('day',created_at)=date_trunc('day',gs)) AS hypes,
        (SELECT count(*) FROM public.post_comments WHERE post_id=_post_id AND date_trunc('day',created_at)=date_trunc('day',gs)) AS comments,
        (SELECT count(*) FROM public.post_shares WHERE post_id=_post_id AND date_trunc('day',created_at)=date_trunc('day',gs)) AS shares
      FROM generate_series(v_since, now(), interval '1 day') gs
    ) d),
    'top_hypers',(SELECT COALESCE(jsonb_agg(row_to_json(h)),'[]'::jsonb) FROM (
      SELECT t.id, t.full_name, t.avatar_url, count(*)::int AS hypes
      FROM public.post_hypes ph JOIN public.talents t ON t.id = ph.sender_talent_id
      WHERE ph.post_id = _post_id GROUP BY t.id, t.full_name, t.avatar_url
      ORDER BY hypes DESC LIMIT 5
    ) h),
    'shares_by_channel',(SELECT COALESCE(jsonb_object_agg(channel, c),'{}'::jsonb) FROM (
      SELECT channel, count(*)::int AS c FROM public.post_shares WHERE post_id=_post_id GROUP BY channel
    ) sc)
  ) INTO result;
  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.record_impression(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_share(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_scorecard(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_top_posts(uuid, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_insights(uuid) TO authenticated;
