
CREATE TABLE public.skill_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  topic_tag text NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE SET NULL,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  level text NOT NULL CHECK (level IN ('foundational','proficient','expert')),
  mastery_at_issue numeric(3,2) NOT NULL,
  attempts_at_issue integer NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  verify_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (talent_id, topic_tag, level)
);

CREATE INDEX idx_skill_credentials_talent ON public.skill_credentials(talent_id);
CREATE INDEX idx_skill_credentials_topic ON public.skill_credentials(topic_tag);
CREATE INDEX idx_skill_credentials_verify ON public.skill_credentials(verify_code);

ALTER TABLE public.skill_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can verify skill credentials"
  ON public.skill_credentials FOR SELECT
  USING (true);

CREATE POLICY "Admins can revoke skill credentials"
  ON public.skill_credentials FOR UPDATE
  TO authenticated
  USING (has_any_admin_role(auth.uid()))
  WITH CHECK (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can delete skill credentials"
  ON public.skill_credentials FOR DELETE
  TO authenticated
  USING (has_any_admin_role(auth.uid()));

-- Inserts performed only via SECURITY DEFINER function below.

CREATE OR REPLACE FUNCTION public.issue_skill_credential(
  _talent_id uuid,
  _module_id uuid,
  _topic_tag text
) RETURNS public.skill_credentials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof public.talent_skill_profile%ROWTYPE;
  _level text;
  _content_id uuid;
  _has_scenario boolean;
  existing public.skill_credentials%ROWTYPE;
  new_row public.skill_credentials%ROWTYPE;
BEGIN
  SELECT * INTO prof
  FROM public.talent_skill_profile
  WHERE talent_id = _talent_id
    AND module_id = _module_id
    AND topic_tag = _topic_tag;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.talent_skill_profile
    WHERE talent_id = _talent_id AND topic_tag = _topic_tag
      AND last_source = 'scenario'
  ) INTO _has_scenario;

  IF prof.mastery >= 0.92 AND prof.attempts >= 12 AND _has_scenario THEN
    _level := 'expert';
  ELSIF prof.mastery >= 0.82 AND prof.attempts >= 8 THEN
    _level := 'proficient';
  ELSIF prof.mastery >= 0.70 AND prof.attempts >= 4 THEN
    _level := 'foundational';
  ELSE
    RETURN NULL;
  END IF;

  SELECT content_id INTO _content_id FROM public.course_modules WHERE id = _module_id;

  -- Skip if already issued at this level or higher
  SELECT * INTO existing
  FROM public.skill_credentials
  WHERE talent_id = _talent_id AND topic_tag = _topic_tag
  ORDER BY CASE level WHEN 'expert' THEN 3 WHEN 'proficient' THEN 2 ELSE 1 END DESC
  LIMIT 1;

  IF existing.id IS NOT NULL THEN
    IF (existing.level = 'expert')
       OR (existing.level = 'proficient' AND _level <> 'expert')
       OR (existing.level = 'foundational' AND _level = 'foundational') THEN
      RETURN existing;
    END IF;
  END IF;

  INSERT INTO public.skill_credentials(
    talent_id, topic_tag, content_id, module_id, level,
    mastery_at_issue, attempts_at_issue, evidence
  ) VALUES (
    _talent_id, _topic_tag, _content_id, _module_id, _level,
    prof.mastery, prof.attempts,
    jsonb_build_object(
      'sources', CASE WHEN _has_scenario THEN ARRAY['quiz','scenario'] ELSE ARRAY['quiz'] END,
      'last_source', prof.last_source,
      'ease', prof.ease,
      'interval_days', prof.interval_days
    )
  )
  ON CONFLICT (talent_id, topic_tag, level) DO UPDATE
    SET mastery_at_issue = EXCLUDED.mastery_at_issue,
        attempts_at_issue = EXCLUDED.attempts_at_issue,
        evidence = EXCLUDED.evidence
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_skill_credential(uuid, uuid, text) TO authenticated, service_role;
