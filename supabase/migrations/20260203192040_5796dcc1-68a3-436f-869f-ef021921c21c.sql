-- Add URL validation trigger for jobs table
CREATE OR REPLACE FUNCTION public.validate_job_application_url()
RETURNS TRIGGER AS $$
BEGIN
  -- For link-type applications, validate URL format
  IF NEW.application_type = 'link' THEN
    IF NEW.application_url IS NULL OR NEW.application_url = '' THEN
      RAISE EXCEPTION 'Application URL is required for link-type jobs';
    END IF;
    IF NEW.application_url !~ '^https?://' THEN
      RAISE EXCEPTION 'Application URL must start with http:// or https://';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert and update
DROP TRIGGER IF EXISTS validate_job_url_trigger ON jobs;
CREATE TRIGGER validate_job_url_trigger
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_application_url();