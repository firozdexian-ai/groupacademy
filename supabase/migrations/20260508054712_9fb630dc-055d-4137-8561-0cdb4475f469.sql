CREATE OR REPLACE FUNCTION public.auto_set_talent_public_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_name boolean;
  v_has_skill boolean;
  v_has_contact boolean;
  v_eligible boolean;
BEGIN
  v_has_name := NEW.full_name IS NOT NULL AND length(btrim(NEW.full_name)) > 1;
  v_has_skill := NEW.skills IS NOT NULL
                 AND jsonb_typeof(NEW.skills) = 'array'
                 AND jsonb_array_length(NEW.skills) > 0;
  v_has_contact := (NEW.email IS NOT NULL AND length(btrim(NEW.email)) > 3)
                OR (NEW.phone IS NOT NULL AND length(btrim(NEW.phone)) > 3);

  v_eligible := v_has_name AND v_has_skill AND v_has_contact;

  IF NEW.public_profile_enabled IS DISTINCT FROM v_eligible THEN
    NEW.public_profile_enabled := v_eligible;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_talent_public_visibility ON public.talents;
CREATE TRIGGER trg_auto_talent_public_visibility
BEFORE INSERT OR UPDATE OF full_name, skills, email, phone ON public.talents
FOR EACH ROW EXECUTE FUNCTION public.auto_set_talent_public_visibility();

-- Backfill existing rows
UPDATE public.talents
SET public_profile_enabled = (
  full_name IS NOT NULL AND length(btrim(full_name)) > 1
  AND skills IS NOT NULL AND jsonb_typeof(skills) = 'array' AND jsonb_array_length(skills) > 0
  AND ((email IS NOT NULL AND length(btrim(email)) > 3) OR (phone IS NOT NULL AND length(btrim(phone)) > 3))
);