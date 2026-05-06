-- Phase 1.3: Onboarding restructure — goal capture + duplicate flagging
ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS primary_goal TEXT,
  ADD COLUMN IF NOT EXISTS is_suspected_duplicate BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_talents_is_suspected_duplicate
  ON public.talents (is_suspected_duplicate)
  WHERE is_suspected_duplicate = true;

-- Validation trigger for primary_goal allowed list
CREATE OR REPLACE FUNCTION public.validate_talent_primary_goal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.primary_goal IS NOT NULL AND NEW.primary_goal NOT IN (
    'first_job','switch_role','get_promoted','freelance_earn',
    'learn_new_skill','study_abroad','build_own_thing'
  ) THEN
    RAISE EXCEPTION 'Invalid primary_goal: %', NEW.primary_goal;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_talent_primary_goal ON public.talents;
CREATE TRIGGER trg_validate_talent_primary_goal
  BEFORE INSERT OR UPDATE OF primary_goal ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.validate_talent_primary_goal();

-- Server-side duplicate check RPC (security definer; bypasses RLS to count)
CREATE OR REPLACE FUNCTION public.check_cv_duplicate(_fingerprint TEXT, _self_user_id UUID)
RETURNS TABLE(duplicate boolean, other_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt INTEGER;
BEGIN
  IF _fingerprint IS NULL OR length(_fingerprint) < 16 THEN
    duplicate := false; other_count := 0; RETURN NEXT; RETURN;
  END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.talents
  WHERE cv_fingerprint = _fingerprint
    AND (user_id IS DISTINCT FROM _self_user_id);

  duplicate := cnt > 0;
  other_count := cnt;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_cv_duplicate(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_cv_duplicate(TEXT, UUID) TO authenticated;