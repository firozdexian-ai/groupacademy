
-- =====================================================================
-- get_talent_outcome_signal
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_talent_outcome_signal(_talent_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skills jsonb;
  v_tracks jsonb;
  v_mastery jsonb;
  v_recency numeric;
  v_last_activity timestamptz;
BEGIN
  -- verified skills (active credentials only)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', sc.id,
    'topic_tag', sc.topic_tag,
    'level', sc.level,
    'mastery_at_issue', sc.mastery_at_issue,
    'verify_code', sc.verify_code,
    'issued_at', sc.issued_at
  ) ORDER BY sc.issued_at DESC), '[]'::jsonb)
  INTO v_skills
  FROM public.skill_credentials sc
  WHERE sc.talent_id = _talent_id AND sc.revoked_at IS NULL;

  -- completed tracks with sponsor (company) info
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'assignment_id', lta.id,
    'track_id', lt.id,
    'track_title', lt.title,
    'track_slug', lt.slug,
    'sponsor_company_id', lt.company_id,
    'sponsor_company_name', co.name,
    'sponsor_company_logo', co.logo_url,
    'completed_at', lta.completed_at,
    'certificate_code', cert.verify_code
  ) ORDER BY lta.completed_at DESC NULLS LAST), '[]'::jsonb)
  INTO v_tracks
  FROM public.learning_track_assignments lta
  JOIN public.learning_tracks lt ON lt.id = lta.track_id
  LEFT JOIN public.companies co ON co.id = lt.company_id
  LEFT JOIN public.certificates cert
    ON cert.track_assignment_id = lta.id AND cert.kind = 'track'
  WHERE lta.talent_id = _talent_id AND lta.status = 'completed';

  -- mastery summary
  SELECT jsonb_build_object(
    'tracked_topics', COUNT(*),
    'avg_mastery', COALESCE(AVG(mastery), 0),
    'strong_topics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('topic_tag', topic_tag, 'mastery', mastery))
      FROM (
        SELECT topic_tag, mastery FROM public.talent_skill_profile
        WHERE talent_id = _talent_id AND mastery >= 0.7
        ORDER BY mastery DESC LIMIT 5
      ) s
    ), '[]'::jsonb),
    'weak_topic_count', (
      SELECT COUNT(*) FROM public.talent_skill_profile
      WHERE talent_id = _talent_id AND mastery < 0.5
    )
  )
  INTO v_mastery
  FROM public.talent_skill_profile WHERE talent_id = _talent_id;

  -- learning recency score (0..1, decays over 90 days)
  SELECT GREATEST(
    COALESCE((SELECT MAX(issued_at) FROM public.skill_credentials WHERE talent_id = _talent_id), 'epoch'::timestamptz),
    COALESCE((SELECT MAX(completed_at) FROM public.learning_track_assignments WHERE talent_id = _talent_id AND completed_at IS NOT NULL), 'epoch'::timestamptz),
    COALESCE((SELECT MAX(updated_at) FROM public.talent_skill_profile WHERE talent_id = _talent_id), 'epoch'::timestamptz)
  ) INTO v_last_activity;

  v_recency := GREATEST(0, LEAST(1,
    1 - (EXTRACT(EPOCH FROM (now() - v_last_activity)) / (90.0 * 86400))
  ));

  RETURN jsonb_build_object(
    'verified_skills', v_skills,
    'tracks_completed', v_tracks,
    'mastery_summary', v_mastery,
    'learning_recency_score', v_recency,
    'last_activity_at', v_last_activity
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_talent_outcome_signal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_talent_outcome_signal(uuid) TO authenticated, service_role;

-- =====================================================================
-- gro10x_global_search
-- =====================================================================
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
    RETURN jsonb_build_object('q', _q, 'results', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'kind', 'company', 'id', c.id, 'title', c.name,
    'subtitle', COALESCE(c.tagline, c.industry),
    'url', '/c/' || COALESCE(c.handle, c.id::text)
  )), '[]'::jsonb)
  INTO v_companies
  FROM public.companies c
  WHERE lower(c.name) LIKE v_pattern OR lower(coalesce(c.handle,'')) LIKE v_pattern
  LIMIT _limit;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'kind', 'talent', 'id', t.id, 'title', t.full_name,
    'subtitle', t.custom_profession,
    'url', '/t/' || t.public_handle
  )), '[]'::jsonb)
  INTO v_talents
  FROM public.talents t
  WHERE t.public_profile_enabled = true AND t.public_handle IS NOT NULL
    AND (lower(t.full_name) LIKE v_pattern OR lower(t.public_handle) LIKE v_pattern)
  LIMIT _limit;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'kind', 'course', 'id', co.id, 'title', co.title,
    'subtitle', co.subtitle,
    'url', '/courses/' || co.id
  )), '[]'::jsonb)
  INTO v_courses
  FROM public.content co
  WHERE co.is_published = true AND lower(co.title) LIKE v_pattern
  LIMIT _limit;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'kind', 'track', 'id', lt.id, 'title', lt.title,
    'subtitle', lt.summary,
    'url', '/app/tracks/' || lt.id
  )), '[]'::jsonb)
  INTO v_tracks
  FROM public.learning_tracks lt
  WHERE lt.is_published = true AND lower(lt.title) LIKE v_pattern
  LIMIT _limit;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'kind', 'job', 'id', j.id, 'title', j.title,
    'subtitle', COALESCE(j.company_name, j.location_text),
    'url', '/jobs/' || j.id
  )), '[]'::jsonb)
  INTO v_jobs
  FROM public.jobs j
  WHERE j.status = 'active' AND lower(j.title) LIKE v_pattern
  LIMIT _limit;

  RETURN jsonb_build_object(
    'q', _q,
    'companies', v_companies,
    'talents', v_talents,
    'courses', v_courses,
    'tracks', v_tracks,
    'jobs', v_jobs
  );
EXCEPTION WHEN undefined_column OR undefined_table THEN
  -- Defensive: if a column changes, return empty rather than crashing UI
  RETURN jsonb_build_object('q', _q, 'results', '[]'::jsonb, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.gro10x_global_search(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gro10x_global_search(text, integer) TO authenticated, service_role;

-- =====================================================================
-- get_public_talent_profile: add tracks_completed + recency
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_public_talent_profile(_handle text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.talents%ROWTYPE;
  creds jsonb;
  mastery jsonb;
  tracks jsonb := '[]'::jsonb;
  recency numeric := 0;
  last_act timestamptz;
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

    -- completed tracks (always alongside credentials when shown)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'track_title', lt.title,
      'track_slug', lt.slug,
      'sponsor_company_name', co.name,
      'sponsor_company_logo', co.logo_url,
      'completed_at', lta.completed_at,
      'certificate_code', cert.verify_code
    ) ORDER BY lta.completed_at DESC NULLS LAST), '[]'::jsonb)
    INTO tracks
    FROM public.learning_track_assignments lta
    JOIN public.learning_tracks lt ON lt.id = lta.track_id
    LEFT JOIN public.companies co ON co.id = lt.company_id
    LEFT JOIN public.certificates cert ON cert.track_assignment_id = lta.id AND cert.kind = 'track'
    WHERE lta.talent_id = t.id AND lta.status = 'completed';
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

  -- recency
  SELECT GREATEST(
    COALESCE((SELECT MAX(issued_at) FROM public.skill_credentials WHERE talent_id = t.id), 'epoch'::timestamptz),
    COALESCE((SELECT MAX(completed_at) FROM public.learning_track_assignments WHERE talent_id = t.id AND completed_at IS NOT NULL), 'epoch'::timestamptz)
  ) INTO last_act;
  recency := GREATEST(0, LEAST(1,
    1 - (EXTRACT(EPOCH FROM (now() - last_act)) / (90.0 * 86400))
  ));

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
    'tracks_completed', tracks,
    'mastery', mastery,
    'learning_recency_score', recency,
    'show_credentials', t.public_show_credentials,
    'show_mastery', t.public_show_mastery
  );
END;
$$;
