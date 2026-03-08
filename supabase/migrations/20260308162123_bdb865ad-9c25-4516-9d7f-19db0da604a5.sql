
-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Get config from vault/env
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, use direct values
  IF v_supabase_url IS NULL THEN
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  END IF;
  IF v_service_key IS NULL THEN
    SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  END IF;

  -- Fire and forget HTTP call to edge function
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'type', 'welcome',
      'talent_id', NEW.id::text
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger: fire welcome email after a new talent is created
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON public.talents
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();
