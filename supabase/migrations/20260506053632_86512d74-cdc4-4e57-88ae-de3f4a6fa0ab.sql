CREATE TABLE IF NOT EXISTS public.talent_skill_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  topic_tag text NOT NULL,
  mastery numeric(3,2) NOT NULL DEFAULT 0.50,
  attempts int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT talent_skill_profile_mastery_range CHECK (mastery >= 0 AND mastery <= 1),
  CONSTRAINT talent_skill_profile_unique UNIQUE (talent_id, module_id, topic_tag)
);

CREATE INDEX IF NOT EXISTS idx_skill_profile_talent ON public.talent_skill_profile(talent_id);
CREATE INDEX IF NOT EXISTS idx_skill_profile_module ON public.talent_skill_profile(module_id);
CREATE INDEX IF NOT EXISTS idx_skill_profile_content ON public.talent_skill_profile(content_id);
CREATE INDEX IF NOT EXISTS idx_skill_profile_topic ON public.talent_skill_profile(topic_tag);
CREATE INDEX IF NOT EXISTS idx_skill_profile_weakness
  ON public.talent_skill_profile(talent_id, module_id, mastery);

ALTER TABLE public.talent_skill_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners view own skill profile"
ON public.talent_skill_profile FOR SELECT
USING (talent_id = auth.uid());

CREATE POLICY "Learners insert own skill profile"
ON public.talent_skill_profile FOR INSERT
WITH CHECK (talent_id = auth.uid());

CREATE POLICY "Learners update own skill profile"
ON public.talent_skill_profile FOR UPDATE
USING (talent_id = auth.uid());

CREATE POLICY "Admins view all skill profiles"
ON public.talent_skill_profile FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_skill_profile_updated_at
BEFORE UPDATE ON public.talent_skill_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();