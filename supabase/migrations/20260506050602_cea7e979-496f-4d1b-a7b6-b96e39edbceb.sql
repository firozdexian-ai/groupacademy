ALTER TABLE public.enrollment_stage_progress
  ADD COLUMN IF NOT EXISTS resource_state jsonb NOT NULL DEFAULT '{}'::jsonb;