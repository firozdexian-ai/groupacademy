-- Create function to auto-link talent_id by email
CREATE OR REPLACE FUNCTION public.link_talent_by_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.talent_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.talent_id
    FROM public.talents
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers to all service tables
CREATE TRIGGER auto_link_talent_career_assessments
  BEFORE INSERT ON public.career_assessments
  FOR EACH ROW EXECUTE FUNCTION public.link_talent_by_email();

CREATE TRIGGER auto_link_talent_mock_interviews
  BEFORE INSERT ON public.mock_interviews
  FOR EACH ROW EXECUTE FUNCTION public.link_talent_by_email();

CREATE TRIGGER auto_link_talent_salary_analyses
  BEFORE INSERT ON public.salary_analyses
  FOR EACH ROW EXECUTE FUNCTION public.link_talent_by_email();

CREATE TRIGGER auto_link_talent_portfolio_requests
  BEFORE INSERT ON public.portfolio_requests
  FOR EACH ROW EXECUTE FUNCTION public.link_talent_by_email();