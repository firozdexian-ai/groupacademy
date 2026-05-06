
CREATE OR REPLACE FUNCTION public.gro10x_global_search(_q text, _limit integer DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q text := lower(coalesce(_q, ''));
  v_pattern text := '%' || v_q || '%';
  v_companies jsonb;
  v_talents jsonb;
  v_courses jsonb;
  v_tracks jsonb;
  v_jobs jsonb;
BEGIN
  IF length(v_q) < 2 THEN
    RETURN jsonb_build_object('q', _q, 'companies','[]','talents','[]','courses','[]','tracks','[]','jobs','[]');
  END IF;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO v_companies FROM (
    SELECT jsonb_build_object(
      'kind','company','id',c.id,'title',c.name,
      'subtitle',COALESCE(c.tagline, c.industry),
      'url','/c/'||COALESCE(c.slug, c.id::text)
    ) AS x
    FROM public.companies c
    WHERE lower(c.name) LIKE v_pattern OR lower(coalesce(c.slug,'')) LIKE v_pattern
    LIMIT _limit
  ) s;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO v_talents FROM (
    SELECT jsonb_build_object(
      'kind','talent','id',t.id,'title',t.full_name,
      'subtitle',t.custom_profession,
      'url','/t/'||t.public_handle
    ) AS x
    FROM public.talents t
    WHERE t.public_profile_enabled = true AND t.public_handle IS NOT NULL
      AND (lower(t.full_name) LIKE v_pattern OR lower(t.public_handle) LIKE v_pattern)
    LIMIT _limit
  ) s;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO v_courses FROM (
    SELECT jsonb_build_object(
      'kind','course','id',co.id,'title',co.title,
      'subtitle',null,
      'url','/courses/'||co.id
    ) AS x
    FROM public.content co
    WHERE co.is_published = true AND lower(co.title) LIKE v_pattern
    LIMIT _limit
  ) s;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO v_tracks FROM (
    SELECT jsonb_build_object(
      'kind','track','id',lt.id,'title',lt.title,
      'subtitle',lt.summary,
      'url','/app/tracks/'||lt.id
    ) AS x
    FROM public.learning_tracks lt
    WHERE lt.is_published = true AND lower(lt.title) LIKE v_pattern
    LIMIT _limit
  ) s;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO v_jobs FROM (
    SELECT jsonb_build_object(
      'kind','job','id',j.id,'title',j.title,
      'subtitle',COALESCE(j.company_name, j.location),
      'url','/jobs/'||j.id
    ) AS x
    FROM public.jobs j
    WHERE j.is_active = true AND lower(j.title) LIKE v_pattern
    LIMIT _limit
  ) s;

  RETURN jsonb_build_object(
    'q', _q,
    'companies', v_companies,
    'talents', v_talents,
    'courses', v_courses,
    'tracks', v_tracks,
    'jobs', v_jobs
  );
END;
$$;
