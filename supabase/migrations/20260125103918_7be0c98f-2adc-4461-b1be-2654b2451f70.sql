-- 1. Drop old functions to clear conflicts
DROP FUNCTION IF EXISTS track_job_click(uuid, text);
DROP FUNCTION IF EXISTS track_content_click(uuid, text);

-- 2. Create "Super Admin" Tracking Function for Jobs
CREATE OR REPLACE FUNCTION public.track_job_click(p_job_id UUID, p_source TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO job_analytics (job_id, source)
  VALUES (p_job_id, p_source);
END;
$$;

-- 3. Create "Super Admin" Tracking Function for Content
CREATE OR REPLACE FUNCTION public.track_content_click(p_content_id UUID, p_source TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO content_analytics (content_id, source)
  VALUES (p_content_id, p_source);
END;
$$;

-- 4. Grant Execute Permission to EVERYONE (Public & Logged In)
GRANT EXECUTE ON FUNCTION public.track_job_click(uuid, text) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_content_click(uuid, text) TO postgres, anon, authenticated, service_role;