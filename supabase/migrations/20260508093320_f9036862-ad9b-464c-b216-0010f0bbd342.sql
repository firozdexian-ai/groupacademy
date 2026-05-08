
-- ============================================================
-- Phase J1+J2: Jobs Hub Consolidation + Zero-Latency Matching
-- ============================================================

-- 1) Single dashboard RPC ------------------------------------
CREATE OR REPLACE FUNCTION public.get_jobs_hub_dashboard(_talent_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'trending',    (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                    FROM (SELECT * FROM public.get_trending_jobs(10)) t),
    'in_field',    (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                    FROM (SELECT * FROM public.get_jobs_in_field(_talent_id, 5)) t),
    'companies',   (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                    FROM (SELECT * FROM public.get_companies_with_signal(NULL, 100)) t),
    'countries',   (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
                    FROM (SELECT * FROM public.get_countries_with_signal(50)) t),
    'remote',      public.get_remote_friendly_summary(),
    'type_counts', (SELECT coalesce(jsonb_object_agg(job_type, cnt), '{}'::jsonb)
                    FROM public.count_jobs_by_type(NULL))
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_jobs_hub_dashboard(uuid) TO authenticated, anon;

-- 2) Deterministic zero-latency ranked match -----------------
-- Returns ranked jobs with a free-tier match_score (0-100) and rank metadata.
CREATE OR REPLACE FUNCTION public.get_ranked_jobs_for_talent(
  _talent_id uuid,
  _cursor    numeric DEFAULT NULL,
  _limit     int     DEFAULT 20
)
RETURNS TABLE (
  job          jsonb,
  match_score  int,
  match_reason text,
  rank_score   numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profession uuid;
  _country    text;
  _skills     text[];
BEGIN
  SELECT t.profession_category_id, t.country,
         ARRAY(
           SELECT lower(trim(
             CASE jsonb_typeof(v)
               WHEN 'string' THEN v #>> '{}'
               WHEN 'object' THEN coalesce(v->>'name', v->>'skill', v->>'tag', '')
               ELSE ''
             END
           ))
           FROM jsonb_array_elements(coalesce(t.skills, '[]'::jsonb)) v
         )
    INTO _profession, _country, _skills
  FROM public.talents t
  WHERE t.id = _talent_id;

  _skills := ARRAY(SELECT s FROM unnest(coalesce(_skills, ARRAY[]::text[])) s WHERE length(s) >= 2);

  RETURN QUERY
  WITH job_tags AS (
    SELECT j.id,
           ARRAY(
             SELECT DISTINCT lower(trim(
               CASE jsonb_typeof(v)
                 WHEN 'string' THEN v #>> '{}'
                 WHEN 'object' THEN coalesce(v->>'name', v->>'skill', v->>'tag', '')
                 ELSE ''
               END
             ))
             FROM (
               SELECT jsonb_array_elements(coalesce(j.requirements, '[]'::jsonb)) AS v
               UNION ALL
               SELECT jsonb_array_elements(coalesce(j.preferred_skills, '[]'::jsonb)) AS v
             ) s
           ) AS tags
    FROM public.jobs j
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
  ),
  engagement AS (
    SELECT j.id,
           coalesce(a.cnt,0) * 3
         + coalesce(s.cnt,0)
         + coalesce(v.cnt,0) * 0.5 AS eng
    FROM public.jobs j
    LEFT JOIN (
      SELECT job_id, count(*)::int AS cnt
      FROM public.job_applications
      WHERE created_at > now() - interval '7 days'
      GROUP BY job_id
    ) a ON a.job_id = j.id
    LEFT JOIN (
      SELECT item_id::uuid AS job_id, count(*)::int AS cnt
      FROM public.saved_items
      WHERE item_type = 'job' AND saved_at > now() - interval '7 days'
      GROUP BY item_id
    ) s ON s.job_id = j.id
    LEFT JOIN (
      SELECT job_id, count(*)::int AS cnt
      FROM public.job_views
      WHERE viewed_at > now() - interval '7 days'
      GROUP BY job_id
    ) v ON v.job_id = j.id
  ),
  followed AS (
    SELECT DISTINCT lower(trim(company_name)) AS name
    FROM public.followed_companies fc
    JOIN public.talents t ON t.user_id = fc.user_id
    WHERE t.id = _talent_id
  ),
  scored AS (
    SELECT
      j.*,
      jt.tags,
      e.eng,
      -- skill overlap 0..1
      CASE
        WHEN coalesce(array_length(jt.tags,1),0) = 0 THEN 0::numeric
        WHEN coalesce(array_length(_skills,1),0) = 0 THEN 0::numeric
        ELSE (
          SELECT count(*)::numeric / array_length(jt.tags,1)
          FROM unnest(jt.tags) tag
          WHERE tag = ANY(_skills)
        )
      END AS skill_ratio,
      EXISTS(SELECT 1 FROM followed f WHERE f.name = lower(trim(j.company_name))) AS is_followed,
      GREATEST(0, 30 - EXTRACT(epoch FROM (now() - j.created_at))/86400)::numeric AS recency_days_left
    FROM public.jobs j
    JOIN job_tags jt ON jt.id = j.id
    LEFT JOIN engagement e ON e.id = j.id
    WHERE j.is_active = true
      AND (j.deadline IS NULL OR j.deadline > now())
  )
  SELECT
    to_jsonb(s.*) - 'tags' - 'eng' - 'skill_ratio' - 'is_followed' - 'recency_days_left'  AS job,
    -- match_score 0..100 (free-tier, deterministic)
    LEAST(100, GREATEST(0, round(
        s.skill_ratio * 60                                                -- skills 60%
      + (CASE WHEN s.profession_category_id = _profession THEN 15 ELSE 0 END)  -- profession 15%
      + (CASE WHEN _country IS NOT NULL AND s.location ILIKE '%'||_country||'%' THEN 10 ELSE 0 END) -- locale 10%
      + (CASE WHEN s.is_followed THEN 10 ELSE 0 END)                       -- followed 10%
      + LEAST(5, s.recency_days_left/6)                                    -- recency up to 5%
    )::int))::int AS match_score,
    CASE
      WHEN s.skill_ratio >= 0.4 THEN 'verified_skill'
      WHEN s.profession_category_id = _profession THEN 'profession'
      WHEN _country IS NOT NULL AND s.location ILIKE '%'||_country||'%' THEN 'location_only'
      ELSE 'recency'
    END AS match_reason,
    -- rank blend (0..1) used as keyset cursor
    (   s.skill_ratio                                          * 0.40
      + LEAST(1, coalesce(s.eng,0)::numeric / 50)              * 0.30
      + LEAST(1, s.recency_days_left / 30)                     * 0.15
      + (CASE WHEN s.is_followed THEN 1 ELSE 0 END)            * 0.15
    )::numeric AS rank_score
  FROM scored s
  WHERE _cursor IS NULL
     OR (
        s.skill_ratio                                          * 0.40
      + LEAST(1, coalesce(s.eng,0)::numeric / 50)              * 0.30
      + LEAST(1, s.recency_days_left / 30)                     * 0.15
      + (CASE WHEN s.is_followed THEN 1 ELSE 0 END)            * 0.15
     ) < _cursor
  ORDER BY rank_score DESC, s.created_at DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranked_jobs_for_talent(uuid, numeric, int) TO authenticated;

-- 3) Warm cache writers --------------------------------------
CREATE OR REPLACE FUNCTION public.rebuild_job_recs_for_talent(_talent_id uuid, _limit int DEFAULT 30)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _n int := 0;
BEGIN
  DELETE FROM public.ai_job_recommendations WHERE talent_id = _talent_id;

  INSERT INTO public.ai_job_recommendations (talent_id, job_id, match_score, reason, match_reason, generated_at)
  SELECT
    _talent_id,
    (r.job->>'id')::uuid,
    r.match_score,
    CASE r.match_reason
      WHEN 'verified_skill' THEN 'Strong skill overlap with your profile'
      WHEN 'profession'     THEN 'Matches your profession'
      WHEN 'location_only'  THEN 'Open in your location'
      ELSE 'Recently posted in your network'
    END,
    r.match_reason,
    now()
  FROM public.get_ranked_jobs_for_talent(_talent_id, NULL, _limit) r
  WHERE r.match_score >= 30
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rebuild_job_recs_for_talent(uuid, int) TO service_role;

-- Cron-callable batch sweeper
CREATE OR REPLACE FUNCTION public.cron_rebuild_stale_job_recs(_batch int DEFAULT 200)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t uuid;
  _processed int := 0;
BEGIN
  FOR _t IN
    SELECT t.id
    FROM public.talents t
    LEFT JOIN (
      SELECT talent_id, max(generated_at) AS last_at
      FROM public.ai_job_recommendations
      GROUP BY talent_id
    ) r ON r.talent_id = t.id
    WHERE t.onboarding_completed_at IS NOT NULL
      AND (r.last_at IS NULL OR r.last_at < now() - interval '24 hours')
    ORDER BY r.last_at NULLS FIRST
    LIMIT _batch
  LOOP
    PERFORM public.rebuild_job_recs_for_talent(_t, 30);
    _processed := _processed + 1;
  END LOOP;
  RETURN _processed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cron_rebuild_stale_job_recs(int) TO service_role;

-- 4) Invalidate cache on profile change ----------------------
CREATE OR REPLACE FUNCTION public.tg_talents_invalidate_job_recs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.skills                  IS DISTINCT FROM OLD.skills)
  OR (NEW.profession_category_id  IS DISTINCT FROM OLD.profession_category_id)
  OR (NEW.country                 IS DISTINCT FROM OLD.country)
  OR (NEW.job_preferences         IS DISTINCT FROM OLD.job_preferences) THEN
    DELETE FROM public.ai_job_recommendations WHERE talent_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_talents_invalidate_job_recs ON public.talents;
CREATE TRIGGER trg_talents_invalidate_job_recs
AFTER UPDATE ON public.talents
FOR EACH ROW EXECUTE FUNCTION public.tg_talents_invalidate_job_recs();

-- 5) Emit job.created event for the Swarm --------------------
CREATE OR REPLACE FUNCTION public.tg_jobs_emit_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    PERFORM public.enqueue_platform_event(
      'job.created', 'job', NEW.id,
      jsonb_build_object(
        'job_id', NEW.id,
        'title', NEW.title,
        'profession_category_id', NEW.profession_category_id,
        'country_hint', NEW.location,
        'company_name', NEW.company_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobs_emit_created ON public.jobs;
CREATE TRIGGER trg_jobs_emit_created
AFTER INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.tg_jobs_emit_created();
