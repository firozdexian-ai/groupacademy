-- Add preferred_skills column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN preferred_skills jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.jobs.preferred_skills IS 'Array of preferred/bonus skills for the job';