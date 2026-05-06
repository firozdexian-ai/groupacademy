
CREATE OR REPLACE FUNCTION public.score_talent_job_mastery(_talent_id uuid, _job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job RECORD;
  _tags text[];
  _tag text;
  _norm text;
  _mastery_topics jsonb := '[]'::jsonb;
  _gap_topics jsonb := '[]'::jsonb;
  _verified jsonb := '[]'::jsonb;
  _matched int := 0;
  _total int := 0;
  _avg_mastery numeric := 0;
  _credential_bonus int := 0;
  _score int := 0;
BEGIN
  SELECT title, requirements, preferred_skills INTO _job FROM public.jobs WHERE id = _job_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'job_not_found');
  END IF;

  -- Build tag list from requirements + preferred_skills (jsonb arrays of strings or {name})
  WITH src AS (
    SELECT jsonb_array_elements(COALESCE(_job.requirements, '[]'::jsonb)) AS v
    UNION ALL
    SELECT jsonb_array_elements(COALESCE(_job.preferred_skills, '[]'::jsonb)) AS v
  )
  SELECT array_agg(DISTINCT lower(trim(
    CASE jsonb_typeof(v)
      WHEN 'string' THEN v #>> '{}'
      WHEN 'object' THEN COALESCE(v->>'name', v->>'skill', v->>'tag', '')
      ELSE ''
    END
  ))) INTO _tags FROM src;

  _tags := COALESCE(_tags, ARRAY[]::text[]);
  _tags := ARRAY(SELECT t FROM unnest(_tags) t WHERE length(t) >= 2);

  _total := COALESCE(array_length(_tags, 1), 0);

  IF _total = 0 THEN
    RETURN jsonb_build_object(
      'mastery_score', 0,
      'matched_count', 0,
      'total_required', 0,
      'mastery_topics', '[]'::jsonb,
      'gap_topics', '[]'::jsonb,
      'verified_credentials', '[]'::jsonb
    );
  END IF;

  FOREACH _tag IN ARRAY _tags LOOP
    _norm := lower(trim(_tag));
    -- Best mastery for this tag (substring match either direction)
    WITH best AS (
      SELECT MAX(mastery)::numeric AS m, SUM(attempts)::int AS att
      FROM public.talent_skill_profile
      WHERE talent_id = _talent_id
        AND (lower(topic_tag) = _norm OR lower(topic_tag) LIKE '%'||_norm||'%' OR _norm LIKE '%'||lower(topic_tag)||'%')
    )
    SELECT m, att INTO _avg_mastery, _credential_bonus FROM best;

    IF _avg_mastery IS NOT NULL AND _avg_mastery >= 0.70 THEN
      _matched := _matched + 1;
      _mastery_topics := _mastery_topics || jsonb_build_object('tag', _tag, 'mastery', _avg_mastery, 'attempts', _credential_bonus);
    ELSE
      _gap_topics := _gap_topics || jsonb_build_object('tag', _tag, 'mastery', COALESCE(_avg_mastery, 0));
    END IF;
  END LOOP;

  -- Verified credentials matching any tag
  SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
    'topic_tag', sc.topic_tag,
    'level', sc.level,
    'verify_code', sc.verify_code,
    'mastery', sc.mastery_at_issue
  )), '[]'::jsonb)
  INTO _verified
  FROM public.skill_credentials sc
  WHERE sc.talent_id = _talent_id
    AND sc.revoked_at IS NULL
    AND EXISTS (
      SELECT 1 FROM unnest(_tags) t
      WHERE lower(sc.topic_tag) = t OR lower(sc.topic_tag) LIKE '%'||t||'%' OR t LIKE '%'||lower(sc.topic_tag)||'%'
    );

  _credential_bonus := jsonb_array_length(_verified);

  -- Score: 70% from coverage, 30% boost from credentials, cap 100
  _score := LEAST(100, ROUND( (_matched::numeric / _total::numeric) * 70 + LEAST(_credential_bonus * 10, 30) ))::int;

  RETURN jsonb_build_object(
    'mastery_score', _score,
    'matched_count', _matched,
    'total_required', _total,
    'mastery_topics', _mastery_topics,
    'gap_topics', _gap_topics,
    'verified_credentials', _verified
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.score_talent_job_mastery(uuid, uuid) TO authenticated;
