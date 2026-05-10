ALTER TABLE public.workforce_members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.hr_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grade_id uuid REFERENCES public.hr_grades(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workforce_user_id ON public.workforce_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workforce_team_id ON public.workforce_members(team_id);
CREATE INDEX IF NOT EXISTS idx_workforce_grade_id ON public.workforce_members(grade_id);