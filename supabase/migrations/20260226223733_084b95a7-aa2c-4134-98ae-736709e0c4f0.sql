CREATE OR REPLACE FUNCTION public.auto_deactivate_expired_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE jobs
  SET is_active = false
  WHERE is_active = true
    AND deadline IS NOT NULL
    AND deadline < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;