ALTER TABLE public.talent_skill_profile
  ADD COLUMN IF NOT EXISTS interval_days int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ease numeric(3,2) NOT NULL DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS due_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

ALTER TABLE public.talent_skill_profile
  DROP CONSTRAINT IF EXISTS talent_skill_profile_ease_min;
ALTER TABLE public.talent_skill_profile
  ADD CONSTRAINT talent_skill_profile_ease_min CHECK (ease >= 1.30);

CREATE INDEX IF NOT EXISTS idx_skill_profile_due
  ON public.talent_skill_profile(talent_id, due_at);