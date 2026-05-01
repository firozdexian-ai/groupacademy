ALTER TABLE public.company_members ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO public.company_members (company_id, user_id, role, status, invited_email)
SELECT '918579c2-0408-4412-9d27-fb8197f45a1d'::uuid,
       NULL,
       'owner',
       'invited',
       'grow10xnow@gmail.com'
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_members
  WHERE invited_email = 'grow10xnow@gmail.com'
    AND company_id = '918579c2-0408-4412-9d27-fb8197f45a1d'::uuid
);

CREATE OR REPLACE FUNCTION public.activate_company_invites_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.company_members
  SET user_id = NEW.id,
      status = 'active',
      updated_at = now()
  WHERE invited_email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_activate_company_invites ON auth.users;
CREATE TRIGGER on_auth_user_activate_company_invites
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.activate_company_invites_on_signup();