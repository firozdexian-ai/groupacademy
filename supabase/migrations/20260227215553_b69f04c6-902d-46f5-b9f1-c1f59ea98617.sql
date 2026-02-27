
-- New table to persist AI job recommendations per talent
CREATE TABLE public.ai_job_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score integer NOT NULL DEFAULT 0,
  reason text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_ai_job_recommendations_talent ON public.ai_job_recommendations(talent_id);

-- Enable RLS
ALTER TABLE public.ai_job_recommendations ENABLE ROW LEVEL SECURITY;

-- Talent can read their own recommendations
CREATE POLICY "Talents can read own recommendations"
ON public.ai_job_recommendations
FOR SELECT
TO authenticated
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Talent can delete their own recommendations (for regeneration)
CREATE POLICY "Talents can delete own recommendations"
ON public.ai_job_recommendations
FOR DELETE
TO authenticated
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Talent can insert their own recommendations
CREATE POLICY "Talents can insert own recommendations"
ON public.ai_job_recommendations
FOR INSERT
TO authenticated
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Admins can manage all
CREATE POLICY "Admins can manage all recommendations"
ON public.ai_job_recommendations
FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()));
