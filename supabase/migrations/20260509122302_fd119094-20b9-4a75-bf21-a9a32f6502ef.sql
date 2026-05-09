CREATE OR REPLACE FUNCTION public.get_employer_jobs_dashboard(p_company_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  location text,
  is_active boolean,
  job_kind text,
  created_at timestamptz,
  deadline timestamptz,
  vacancies integer,
  salary_range_min integer,
  salary_range_max integer,
  salary_currency text,
  applicant_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members
     WHERE company_id = p_company_id
       AND user_id = auth.uid()
       AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'NOT_COMPANY_MEMBER' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT j.id,
         j.title,
         j.location,
         j.is_active,
         j.job_kind,
         j.created_at,
         j.deadline,
         j.vacancies,
         j.salary_range_min,
         j.salary_range_max,
         j.salary_currency,
         COALESCE(c.cnt, 0) AS applicant_count
    FROM public.jobs j
    LEFT JOIN (
      SELECT job_id, COUNT(*)::bigint AS cnt
        FROM public.job_applications
       GROUP BY job_id
    ) c ON c.job_id = j.id
   WHERE j.company_id = p_company_id
   ORDER BY j.created_at DESC
   LIMIT 200;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_employer_jobs_dashboard(uuid) TO authenticated;