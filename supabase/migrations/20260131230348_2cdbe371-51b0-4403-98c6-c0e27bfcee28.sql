-- Add job_preferences JSONB column to talents table
ALTER TABLE talents 
ADD COLUMN IF NOT EXISTS job_preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN talents.job_preferences IS 'User job preferences: preferred_job_types, preferred_locations, salary_min, salary_max, industries';