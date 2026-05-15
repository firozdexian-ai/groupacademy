CREATE OR REPLACE FUNCTION public.handle_new_user_talent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_ref text;
  v_referrer_id uuid;
BEGIN
  INSERT INTO public.talents (user_id, email, full_name, phone, country_code, country)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'country_code', '+880'),
    COALESCE(new.raw_user_meta_data->>'country', 'Bangladesh')
  );

  -- Apply referral atomically if a code/id was passed in signup metadata.
  v_ref := NULLIF(new.raw_user_meta_data->>'referral_code', '');
  IF v_ref IS NOT NULL THEN
    BEGIN
      SELECT id INTO v_referrer_id
      FROM public.talents
      WHERE ref_code = v_ref OR id::text = v_ref
      LIMIT 1;

      IF v_referrer_id IS NOT NULL THEN
        UPDATE public.talents
        SET referred_by = v_referrer_id
        WHERE user_id = new.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Never block signup on a bad referral.
      NULL;
    END;
  END IF;

  RETURN new;
END;
$function$;