
-- ============ followed_companies ============
CREATE TABLE public.followed_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_name)
);

CREATE INDEX idx_followed_companies_user ON public.followed_companies(user_id);
CREATE INDEX idx_followed_companies_company ON public.followed_companies(company_name);

ALTER TABLE public.followed_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own follows" ON public.followed_companies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own follows" ON public.followed_companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own follows" ON public.followed_companies
  FOR DELETE USING (auth.uid() = user_id);

-- ============ get_companies_with_signal ============
CREATE OR REPLACE FUNCTION public.get_companies_with_signal(
  p_country text DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  company_name text,
  logo_url text,
  active_jobs bigint,
  jobs_last_14d bigint,
  top_location text,
  top_type text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT j.company_name, j.company_logo_url, j.location, j.job_type::text AS jt, j.created_at, j.deadline
    FROM public.jobs j
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
      AND (
        p_country IS NULL
        OR lower(coalesce(split_part(j.location, ',', -1), '')) LIKE '%' || lower(p_country) || '%'
      )
  ),
  agg AS (
    SELECT
      company_name,
      max(company_logo_url) AS logo_url,
      count(*) AS active_jobs,
      count(*) FILTER (WHERE created_at > now() - interval '14 days') AS jobs_last_14d
    FROM base
    GROUP BY company_name
  ),
  top_loc AS (
    SELECT DISTINCT ON (company_name) company_name, location AS top_location
    FROM (
      SELECT company_name, location, count(*) AS c
      FROM base WHERE location IS NOT NULL AND location <> ''
      GROUP BY company_name, location
    ) s
    ORDER BY company_name, c DESC
  ),
  top_typ AS (
    SELECT DISTINCT ON (company_name) company_name, jt AS top_type
    FROM (
      SELECT company_name, jt, count(*) AS c
      FROM base GROUP BY company_name, jt
    ) s
    ORDER BY company_name, c DESC
  )
  SELECT a.company_name, a.logo_url, a.active_jobs, a.jobs_last_14d,
         tl.top_location, tt.top_type
  FROM agg a
  LEFT JOIN top_loc tl USING (company_name)
  LEFT JOIN top_typ tt USING (company_name)
  ORDER BY (a.active_jobs + a.jobs_last_14d * 2) DESC, a.company_name ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_companies_with_signal(text, int) TO anon, authenticated;

-- ============ get_company_detail ============
CREATE OR REPLACE FUNCTION public.get_company_detail(p_company_name text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT j.* FROM public.jobs j
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
      AND lower(j.company_name) = lower(p_company_name)
  ),
  header AS (
    SELECT
      max(company_name) AS company_name,
      max(company_logo_url) AS logo_url,
      count(*) AS active_jobs,
      count(*) FILTER (WHERE created_at > now() - interval '14 days') AS jobs_last_14d
    FROM base
  ),
  loc_split AS (
    SELECT location, count(*) AS c FROM base
    WHERE location IS NOT NULL GROUP BY location ORDER BY c DESC LIMIT 8
  ),
  type_split AS (
    SELECT job_type::text AS jt, count(*) AS c FROM base GROUP BY job_type ORDER BY c DESC
  )
  SELECT jsonb_build_object(
    'header', (SELECT to_jsonb(header) FROM header),
    'locations', coalesce((SELECT jsonb_agg(jsonb_build_object('location', location, 'count', c)) FROM loc_split), '[]'::jsonb),
    'types', coalesce((SELECT jsonb_agg(jsonb_build_object('type', jt, 'count', c)) FROM type_split), '[]'::jsonb),
    'jobs', coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC) FROM base b), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_company_detail(text) TO anon, authenticated;

-- ============ get_countries_with_signal ============
CREATE OR REPLACE FUNCTION public.get_countries_with_signal(p_limit int DEFAULT 50)
RETURNS TABLE (
  country text,
  active_jobs bigint,
  jobs_last_14d bigint,
  top_cities jsonb,
  top_companies jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      trim(split_part(j.location, ',', -1)) AS country,
      trim(split_part(j.location, ',', 1)) AS city,
      j.company_name,
      j.company_logo_url,
      j.created_at
    FROM public.jobs j
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
      AND j.location IS NOT NULL AND j.location <> ''
  ),
  agg AS (
    SELECT country,
           count(*) AS active_jobs,
           count(*) FILTER (WHERE created_at > now() - interval '14 days') AS jobs_last_14d
    FROM base WHERE country <> '' GROUP BY country
  ),
  cities AS (
    SELECT country, jsonb_agg(jsonb_build_object('name', city, 'count', c) ORDER BY c DESC) FILTER (WHERE rn <= 3) AS top_cities
    FROM (
      SELECT country, city, count(*) AS c,
             row_number() OVER (PARTITION BY country ORDER BY count(*) DESC) AS rn
      FROM base WHERE city <> '' GROUP BY country, city
    ) s
    GROUP BY country
  ),
  comps AS (
    SELECT country, jsonb_agg(jsonb_build_object('name', company_name, 'logo_url', logo_url) ORDER BY c DESC) FILTER (WHERE rn <= 3) AS top_companies
    FROM (
      SELECT country, company_name, max(company_logo_url) AS logo_url, count(*) AS c,
             row_number() OVER (PARTITION BY country ORDER BY count(*) DESC) AS rn
      FROM base GROUP BY country, company_name
    ) s
    GROUP BY country
  )
  SELECT a.country, a.active_jobs, a.jobs_last_14d,
         coalesce(c.top_cities, '[]'::jsonb),
         coalesce(co.top_companies, '[]'::jsonb)
  FROM agg a
  LEFT JOIN cities c USING (country)
  LEFT JOIN comps co USING (country)
  ORDER BY a.active_jobs DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_countries_with_signal(int) TO anon, authenticated;

-- ============ get_remote_friendly_summary ============
CREATE OR REPLACE FUNCTION public.get_remote_friendly_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT j.company_name, j.company_logo_url, j.created_at
    FROM public.jobs j
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
      AND (j.job_type::text = 'remote'
           OR lower(coalesce(j.location, '')) LIKE '%remote%')
  ),
  comps AS (
    SELECT company_name, max(company_logo_url) AS logo_url, count(*) AS c
    FROM base GROUP BY company_name ORDER BY c DESC LIMIT 6
  )
  SELECT jsonb_build_object(
    'active_jobs', (SELECT count(*) FROM base),
    'jobs_last_14d', (SELECT count(*) FROM base WHERE created_at > now() - interval '14 days'),
    'top_companies', coalesce((SELECT jsonb_agg(jsonb_build_object('name', company_name, 'logo_url', logo_url)) FROM comps), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_remote_friendly_summary() TO anon, authenticated;
