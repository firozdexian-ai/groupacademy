CREATE OR REPLACE FUNCTION public.notify_admin_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (
    'company_signup',
    'New company registered',
    COALESCE(NEW.name, 'Unnamed company'),
    jsonb_build_object('company_id', NEW.id, 'industry', NEW.industry, 'country', NEW.country)
  );
  RETURN NEW;
END;
$$;