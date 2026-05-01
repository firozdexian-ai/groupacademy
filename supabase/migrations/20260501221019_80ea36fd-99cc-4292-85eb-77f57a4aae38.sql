ALTER TABLE public.company_members DROP CONSTRAINT IF EXISTS company_members_role_check;
ALTER TABLE public.company_members ADD CONSTRAINT company_members_role_check
  CHECK (role IN ('owner','admin','editor','member'));

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS source_detail text;

DROP INDEX IF EXISTS public.contacts_company_user_uq;
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_company_user_uq;
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_company_user_uq UNIQUE (company_id, user_id);

CREATE OR REPLACE FUNCTION public.sync_member_to_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_name text;
  v_phone text;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  SELECT u.email,
         COALESCE(u.raw_user_meta_data->>'full_name', u.email),
         u.raw_user_meta_data->>'phone'
    INTO v_email, v_name, v_phone
  FROM auth.users u WHERE u.id = NEW.user_id;

  IF v_email IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.contacts (
    company_id, user_id, full_name, email, phone,
    designation, source, source_detail, is_primary
  )
  VALUES (
    NEW.company_id, NEW.user_id, v_name, v_email, v_phone,
    NEW.role, 'gro10x_signup', 'company_members.' || NEW.role,
    NEW.role = 'owner'
  )
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET designation = EXCLUDED.designation,
        source_detail = EXCLUDED.source_detail,
        full_name = COALESCE(public.contacts.full_name, EXCLUDED.full_name),
        phone = COALESCE(public.contacts.phone, EXCLUDED.phone),
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_member_to_contact ON public.company_members;
CREATE TRIGGER trg_sync_member_to_contact
  AFTER INSERT OR UPDATE OF role, status ON public.company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_to_contact();

INSERT INTO public.contacts (
  company_id, user_id, full_name, email, phone, designation, source, source_detail, is_primary
)
SELECT cm.company_id,
       cm.user_id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.email),
       u.email,
       u.raw_user_meta_data->>'phone',
       cm.role,
       'gro10x_signup',
       'backfill.' || cm.role,
       cm.role = 'owner'
FROM public.company_members cm
JOIN auth.users u ON u.id = cm.user_id
WHERE cm.user_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;