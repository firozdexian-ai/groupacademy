ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'content_lead';

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS scope_school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;