-- 1. Application source + AI relevance scoring
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS ai_match_score integer,
  ADD COLUMN IF NOT EXISTS ai_match_rationale text,
  ADD COLUMN IF NOT EXISTS ai_scored_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_notes text,
  ADD COLUMN IF NOT EXISTS added_by uuid;

-- Constraints (safe re-run)
DO $$ BEGIN
  ALTER TABLE public.job_applications
    ADD CONSTRAINT job_applications_source_check
    CHECK (source IN ('platform','external'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications
    ADD CONSTRAINT job_applications_ai_match_score_range
    CHECK (ai_match_score IS NULL OR (ai_match_score BETWEEN 0 AND 100));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_job_applications_source ON public.job_applications(source);
CREATE INDEX IF NOT EXISTS idx_job_applications_score  ON public.job_applications(ai_match_score DESC NULLS LAST);

-- 2. Per-channel job promotion log
CREATE TABLE IF NOT EXISTS public.job_channel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','linkedin','facebook','email','other')),
  posted_by uuid,
  caption text,
  posted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_channel_posts_job ON public.job_channel_posts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_channel_posts_channel ON public.job_channel_posts(channel);

ALTER TABLE public.job_channel_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage channel posts" ON public.job_channel_posts;
CREATE POLICY "Admins manage channel posts"
  ON public.job_channel_posts FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));