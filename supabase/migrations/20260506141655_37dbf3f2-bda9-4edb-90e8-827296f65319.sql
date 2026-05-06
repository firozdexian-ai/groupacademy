-- job_views table
CREATE TABLE IF NOT EXISTS public.job_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_views_job_recent ON public.job_views (job_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_views_talent ON public.job_views (talent_id, viewed_at DESC);

ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents insert own job views"
ON public.job_views FOR INSERT
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Talents view own job views"
ON public.job_views FOR SELECT
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all job views"
ON public.job_views FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trending jobs RPC
CREATE OR REPLACE FUNCTION public.get_trending_jobs(limit_n integer DEFAULT 10)
RETURNS SETOF public.jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      j.id,
      COALESCE(a.cnt, 0) * 3
        + COALESCE(s.cnt, 0) * 1
        + COALESCE(v.cnt, 0) * 0.5
        + CASE WHEN j.is_featured THEN 0.5 ELSE 0 END AS score
    FROM public.jobs j
    LEFT JOIN (
      SELECT job_id, COUNT(*)::int AS cnt
      FROM public.job_applications
      WHERE created_at > now() - interval '7 days'
      GROUP BY job_id
    ) a ON a.job_id = j.id
    LEFT JOIN (
      SELECT item_id::uuid AS job_id, COUNT(*)::int AS cnt
      FROM public.saved_items
      WHERE item_type = 'job' AND saved_at > now() - interval '7 days'
      GROUP BY item_id
    ) s ON s.job_id = j.id
    LEFT JOIN (
      SELECT job_id, COUNT(*)::int AS cnt
      FROM public.job_views
      WHERE viewed_at > now() - interval '7 days'
      GROUP BY job_id
    ) v ON v.job_id = j.id
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
  )
  SELECT j.*
  FROM public.jobs j
  JOIN ranked r ON r.id = j.id
  ORDER BY r.score DESC, j.created_at DESC
  LIMIT limit_n;
$$;

-- Jobs in talent's field (or country fallback)
CREATE OR REPLACE FUNCTION public.get_jobs_in_field(_talent_id uuid, _limit integer DEFAULT 5)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profession uuid;
  _country text;
BEGIN
  SELECT profession_category_id, country INTO _profession, _country
  FROM public.talents WHERE id = _talent_id;

  IF _profession IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.jobs
    WHERE is_active = true
      AND (deadline IS NULL OR deadline > now())
      AND profession_category_id = _profession
    ORDER BY created_at DESC
    LIMIT _limit;
  ELSIF _country IS NOT NULL AND _country <> '' THEN
    RETURN QUERY
    SELECT * FROM public.jobs
    WHERE is_active = true
      AND (deadline IS NULL OR deadline > now())
      AND location ILIKE '%' || _country || '%'
    ORDER BY created_at DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Count jobs by type (optional country filter)
CREATE OR REPLACE FUNCTION public.count_jobs_by_type(_country text DEFAULT NULL)
RETURNS TABLE(job_type text, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.job_type::text, COUNT(*)::bigint AS cnt
  FROM public.jobs j
  WHERE j.is_active = true
    AND (j.deadline IS NULL OR j.deadline > now())
    AND (_country IS NULL OR _country = '' OR j.location ILIKE '%' || _country || '%')
  GROUP BY j.job_type
  ORDER BY cnt DESC;
$$;