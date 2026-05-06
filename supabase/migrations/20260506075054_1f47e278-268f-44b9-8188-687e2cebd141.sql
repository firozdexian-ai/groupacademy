
CREATE OR REPLACE FUNCTION public.get_tutor_mastery_context(
  _talent_id uuid,
  _module_id uuid DEFAULT NULL,
  _content_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _weak jsonb := '[]'::jsonb;
  _strong jsonb := '[]'::jsonb;
  _due int := 0;
  _creds jsonb := '[]'::jsonb;
  _last jsonb := NULL;
BEGIN
  -- Weak topics
  SELECT COALESCE(jsonb_agg(jsonb_build_object('tag', topic_tag, 'mastery', mastery, 'attempts', attempts) ORDER BY mastery ASC), '[]'::jsonb)
  INTO _weak
  FROM (
    SELECT topic_tag, mastery, attempts
    FROM public.talent_skill_profile
    WHERE talent_id = _talent_id
      AND mastery < 0.70
      AND (_module_id IS NULL OR module_id = _module_id)
      AND (_content_id IS NULL OR content_id = _content_id)
    ORDER BY mastery ASC, attempts DESC
    LIMIT 5
  ) w;

  -- Strong topics
  SELECT COALESCE(jsonb_agg(jsonb_build_object('tag', topic_tag, 'mastery', mastery) ORDER BY mastery DESC), '[]'::jsonb)
  INTO _strong
  FROM (
    SELECT topic_tag, mastery
    FROM public.talent_skill_profile
    WHERE talent_id = _talent_id
      AND mastery >= 0.80
      AND (_module_id IS NULL OR module_id = _module_id)
      AND (_content_id IS NULL OR content_id = _content_id)
    ORDER BY mastery DESC
    LIMIT 5
  ) s;

  -- Due for review
  SELECT COUNT(*) INTO _due
  FROM public.talent_skill_profile
  WHERE talent_id = _talent_id
    AND due_at <= now()
    AND (_module_id IS NULL OR module_id = _module_id)
    AND (_content_id IS NULL OR content_id = _content_id);

  -- Credentials
  SELECT COALESCE(jsonb_agg(jsonb_build_object('tag', topic_tag, 'level', level)), '[]'::jsonb)
  INTO _creds
  FROM public.skill_credentials
  WHERE talent_id = _talent_id AND revoked_at IS NULL
  LIMIT 10;

  -- Last scenario signal
  SELECT jsonb_build_object('tag', topic_tag, 'mastery', mastery, 'when', last_attempt_at)
  INTO _last
  FROM public.talent_skill_profile
  WHERE talent_id = _talent_id AND last_source = 'scenario'
  ORDER BY last_attempt_at DESC NULLS LAST
  LIMIT 1;

  RETURN jsonb_build_object(
    'weak_topics', _weak,
    'strong_topics', _strong,
    'due_for_review_count', _due,
    'credentials', _creds,
    'last_scenario', _last
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tutor_mastery_context(uuid, uuid, uuid) TO authenticated;
