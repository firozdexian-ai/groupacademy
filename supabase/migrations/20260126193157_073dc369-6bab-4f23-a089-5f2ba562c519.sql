-- Fix: Update handle_new_user_talent() to include country and country_code fields
CREATE OR REPLACE FUNCTION public.handle_new_user_talent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.talents (
    user_id,
    email,
    full_name,
    phone,
    country_code,
    country
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+880'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'BD')
  )
  ON CONFLICT (LOWER(email)) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.talents.full_name),
    country_code = COALESCE(NULLIF(EXCLUDED.country_code, '+880'), public.talents.country_code),
    country = COALESCE(NULLIF(EXCLUDED.country, 'BD'), public.talents.country);
  
  RETURN NEW;
END;
$$;

-- Fix existing users: sync country data from auth.users metadata
UPDATE public.talents t
SET 
  country_code = COALESCE(u.raw_user_meta_data->>'country_code', t.country_code),
  country = COALESCE(u.raw_user_meta_data->>'country', t.country)
FROM auth.users u
WHERE t.user_id = u.id
  AND u.raw_user_meta_data->>'country' IS NOT NULL
  AND u.raw_user_meta_data->>'country' != '';