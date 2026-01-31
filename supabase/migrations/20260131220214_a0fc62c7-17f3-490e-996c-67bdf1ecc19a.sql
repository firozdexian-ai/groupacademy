-- Create phone normalization function for consistent phone number storage and lookup
CREATE OR REPLACE FUNCTION public.normalize_phone(
  p_country_code text,
  p_phone text
) RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters except leading +
  RETURN CASE 
    WHEN p_phone IS NULL OR p_phone = '' THEN NULL
    WHEN p_phone LIKE '+%' THEN regexp_replace(p_phone, '[^0-9+]', '', 'g')
    ELSE COALESCE(p_country_code, '') || regexp_replace(p_phone, '[^0-9]', '', 'g')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment for documentation
COMMENT ON FUNCTION public.normalize_phone(text, text) IS 'Normalizes phone numbers by combining country code and digits, removing non-numeric characters';