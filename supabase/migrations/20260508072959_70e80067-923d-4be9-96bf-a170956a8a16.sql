
-- 1) Tool RPC: agent updates the current user's talent profile
CREATE OR REPLACE FUNCTION public.update_talent_profile(p_field text, p_value text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_talent_id uuid;
  v_field text := lower(btrim(p_field));
  v_skills jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = v_uid LIMIT 1;
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_talent');
  END IF;

  IF v_field NOT IN ('full_name','phone','email','skills') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_field');
  END IF;

  IF v_field = 'full_name' THEN
    UPDATE public.talents SET full_name = btrim(p_value) WHERE id = v_talent_id;
  ELSIF v_field = 'phone' THEN
    UPDATE public.talents SET phone = btrim(p_value) WHERE id = v_talent_id;
  ELSIF v_field = 'email' THEN
    UPDATE public.talents SET email = btrim(p_value) WHERE id = v_talent_id;
  ELSIF v_field = 'skills' THEN
    -- Accept either JSON array or comma-separated string
    BEGIN
      v_skills := p_value::jsonb;
      IF jsonb_typeof(v_skills) <> 'array' THEN
        v_skills := NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_skills := NULL;
    END;
    IF v_skills IS NULL THEN
      v_skills := COALESCE(
        (SELECT jsonb_agg(btrim(s)) FROM unnest(string_to_array(p_value, ',')) AS s WHERE btrim(s) <> ''),
        '[]'::jsonb
      );
    END IF;
    UPDATE public.talents SET skills = v_skills WHERE id = v_talent_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'field', v_field);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_talent_profile(text, text) TO authenticated;

-- 2) Market-ready Telegram alert trigger (fires on false -> true flip)
CREATE OR REPLACE FUNCTION public.notify_talent_market_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  IF COALESCE(OLD.public_profile_enabled, false) = false
     AND COALESCE(NEW.public_profile_enabled, false) = true THEN
    v_url := 'https://iqdnbmnqpgmhtaiesulr.supabase.co/functions/v1/notify-market-ready';
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object(
        'talent_id', NEW.id,
        'full_name', NEW.full_name,
        'email',     NEW.email,
        'country',   NEW.country
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_talent_market_ready ON public.talents;
CREATE TRIGGER trg_notify_talent_market_ready
AFTER UPDATE OF public_profile_enabled ON public.talents
FOR EACH ROW
EXECUTE FUNCTION public.notify_talent_market_ready();
