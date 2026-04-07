CREATE OR REPLACE FUNCTION public.send_welcome_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  IF v_supabase_url IS NULL THEN
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  END IF;
  IF v_service_key IS NULL THEN
    SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  END IF;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE LOG 'send_welcome_email: skipping — config not available';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'templateName', 'welcome',
      'recipientEmail', NEW.email,
      'idempotencyKey', 'welcome-' || NEW.id::text,
      'templateData', jsonb_build_object('name', COALESCE(NEW.full_name, 'there'))
    )
  );

  RETURN NEW;
END;
$function$;