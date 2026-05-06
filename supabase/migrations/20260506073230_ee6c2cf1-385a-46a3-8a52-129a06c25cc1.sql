
ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS public_handle text UNIQUE,
  ADD COLUMN IF NOT EXISTS public_profile_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_show_mastery boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_show_credentials boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_bio text;

ALTER TABLE public.talents
  ADD CONSTRAINT talents_public_handle_format
  CHECK (public_handle IS NULL OR public_handle ~ '^[a-z0-9-]{3,40}$');

CREATE INDEX IF NOT EXISTS idx_talents_public_handle ON public.talents(public_handle) WHERE public_handle IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_public_talent_profile(_handle text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.talents%ROWTYPE;
  creds jsonb;
  mastery jsonb;
BEGIN
  SELECT * INTO t FROM public.talents
  WHERE public_handle = lower(_handle) AND public_profile_enabled = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF t.public_show_credentials THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', sc.id,
      'topic_tag', sc.topic_tag,
      'level', sc.level,
      'mastery_at_issue', sc.mastery_at_issue,
      'attempts_at_issue', sc.attempts_at_issue,
      'verify_code', sc.verify_code,
      'issued_at', sc.issued_at,
      'course_title', c.title
    ) ORDER BY sc.issued_at DESC), '[]'::jsonb)
    INTO creds
    FROM public.skill_credentials sc
    LEFT JOIN public.content c ON c.id = sc.content_id
    WHERE sc.talent_id = t.id AND sc.revoked_at IS NULL;
  ELSE
    creds := '[]'::jsonb;
  END IF;

  IF t.public_show_mastery THEN
    SELECT jsonb_build_object(
      'tracked_topics', COUNT(*),
      'avg_mastery', COALESCE(AVG(mastery), 0),
      'top_strengths', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('topic_tag', topic_tag, 'mastery', mastery))
        FROM (
          SELECT topic_tag, mastery FROM public.talent_skill_profile
          WHERE talent_id = t.id ORDER BY mastery DESC LIMIT 5
        ) x
      ), '[]'::jsonb)
    )
    INTO mastery
    FROM public.talent_skill_profile WHERE talent_id = t.id;
  ELSE
    mastery := NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', t.id,
    'handle', t.public_handle,
    'full_name', t.full_name,
    'profile_photo_url', t.profile_photo_url,
    'cover_image_url', t.cover_image_url,
    'profession', t.custom_profession,
    'country', t.country,
    'linkedin_url', t.linkedin_url,
    'portfolio_url', t.portfolio_url,
    'bio', t.public_bio,
    'credentials', creds,
    'mastery', mastery,
    'show_credentials', t.public_show_credentials,
    'show_mastery', t.public_show_mastery
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_talent_profile(text) TO anon, authenticated;
