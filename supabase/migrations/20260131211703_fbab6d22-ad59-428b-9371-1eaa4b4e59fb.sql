
-- Add validation trigger to prevent jobs with email application type but no email
CREATE OR REPLACE FUNCTION public.validate_job_application_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_type = 'email' 
     AND (NEW.application_email IS NULL OR NEW.application_email = '') THEN
    RAISE EXCEPTION 'Jobs with application_type=email must have a valid application_email';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce this on insert and update
DROP TRIGGER IF EXISTS enforce_job_application_email ON jobs;
CREATE TRIGGER enforce_job_application_email
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_application_email();
