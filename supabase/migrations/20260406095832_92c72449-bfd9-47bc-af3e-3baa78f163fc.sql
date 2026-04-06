
-- Part 3: Country normalization function
CREATE OR REPLACE FUNCTION public.normalize_country_name(p_country text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_country IS NULL OR p_country = '' THEN
    RETURN p_country;
  END IF;
  
  RETURN CASE UPPER(TRIM(p_country))
    WHEN 'BD' THEN 'Bangladesh'
    WHEN 'IN' THEN 'India'
    WHEN 'US' THEN 'United States'
    WHEN 'USA' THEN 'United States'
    WHEN 'UK' THEN 'United Kingdom'
    WHEN 'GB' THEN 'United Kingdom'
    WHEN 'AE' THEN 'United Arab Emirates'
    WHEN 'UAE' THEN 'United Arab Emirates'
    WHEN 'SA' THEN 'Saudi Arabia'
    WHEN 'KSA' THEN 'Saudi Arabia'
    WHEN 'CA' THEN 'Canada'
    WHEN 'AU' THEN 'Australia'
    WHEN 'DE' THEN 'Germany'
    WHEN 'FR' THEN 'France'
    WHEN 'JP' THEN 'Japan'
    WHEN 'SG' THEN 'Singapore'
    WHEN 'MY' THEN 'Malaysia'
    WHEN 'QA' THEN 'Qatar'
    WHEN 'KW' THEN 'Kuwait'
    WHEN 'BH' THEN 'Bahrain'
    WHEN 'OM' THEN 'Oman'
    WHEN 'PK' THEN 'Pakistan'
    WHEN 'LK' THEN 'Sri Lanka'
    WHEN 'NP' THEN 'Nepal'
    WHEN 'PH' THEN 'Philippines'
    WHEN 'ID' THEN 'Indonesia'
    WHEN 'TH' THEN 'Thailand'
    WHEN 'VN' THEN 'Vietnam'
    WHEN 'KR' THEN 'South Korea'
    WHEN 'CN' THEN 'China'
    WHEN 'NL' THEN 'Netherlands'
    WHEN 'SE' THEN 'Sweden'
    WHEN 'NO' THEN 'Norway'
    WHEN 'DK' THEN 'Denmark'
    WHEN 'FI' THEN 'Finland'
    WHEN 'IE' THEN 'Ireland'
    WHEN 'NZ' THEN 'New Zealand'
    WHEN 'IT' THEN 'Italy'
    WHEN 'ES' THEN 'Spain'
    WHEN 'PT' THEN 'Portugal'
    WHEN 'CH' THEN 'Switzerland'
    WHEN 'AT' THEN 'Austria'
    WHEN 'BE' THEN 'Belgium'
    WHEN 'PL' THEN 'Poland'
    WHEN 'DUBAI' THEN 'United Arab Emirates'
    WHEN 'ABU DHABI' THEN 'United Arab Emirates'
    WHEN 'ENGLAND' THEN 'United Kingdom'
    WHEN 'SCOTLAND' THEN 'United Kingdom'
    WHEN 'WALES' THEN 'United Kingdom'
    WHEN 'UNITED STATES' THEN 'United States'
    WHEN 'UNITED KINGDOM' THEN 'United Kingdom'
    WHEN 'UNITED ARAB EMIRATES' THEN 'United Arab Emirates'
    WHEN 'SAUDI ARABIA' THEN 'Saudi Arabia'
    WHEN 'SOUTH KOREA' THEN 'South Korea'
    WHEN 'SRI LANKA' THEN 'Sri Lanka'
    WHEN 'NEW ZEALAND' THEN 'New Zealand'
    WHEN 'BANGLADESH' THEN 'Bangladesh'
    WHEN 'INDIA' THEN 'India'
    WHEN 'CANADA' THEN 'Canada'
    WHEN 'AUSTRALIA' THEN 'Australia'
    WHEN 'GERMANY' THEN 'Germany'
    WHEN 'FRANCE' THEN 'France'
    WHEN 'JAPAN' THEN 'Japan'
    WHEN 'SINGAPORE' THEN 'Singapore'
    WHEN 'MALAYSIA' THEN 'Malaysia'
    WHEN 'QATAR' THEN 'Qatar'
    WHEN 'KUWAIT' THEN 'Kuwait'
    WHEN 'BAHRAIN' THEN 'Bahrain'
    WHEN 'OMAN' THEN 'Oman'
    WHEN 'PAKISTAN' THEN 'Pakistan'
    WHEN 'NEPAL' THEN 'Nepal'
    WHEN 'PHILIPPINES' THEN 'Philippines'
    WHEN 'INDONESIA' THEN 'Indonesia'
    WHEN 'THAILAND' THEN 'Thailand'
    WHEN 'VIETNAM' THEN 'Vietnam'
    WHEN 'CHINA' THEN 'China'
    WHEN 'NETHERLANDS' THEN 'Netherlands'
    WHEN 'SWEDEN' THEN 'Sweden'
    WHEN 'NORWAY' THEN 'Norway'
    WHEN 'DENMARK' THEN 'Denmark'
    WHEN 'FINLAND' THEN 'Finland'
    WHEN 'IRELAND' THEN 'Ireland'
    WHEN 'ITALY' THEN 'Italy'
    WHEN 'SPAIN' THEN 'Spain'
    WHEN 'PORTUGAL' THEN 'Portugal'
    WHEN 'SWITZERLAND' THEN 'Switzerland'
    WHEN 'AUSTRIA' THEN 'Austria'
    WHEN 'BELGIUM' THEN 'Belgium'
    WHEN 'POLAND' THEN 'Poland'
    ELSE TRIM(p_country)
  END;
END;
$$;

-- Trigger to auto-normalize country on talents table
CREATE OR REPLACE FUNCTION public.normalize_talent_country()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.country IS NOT NULL AND NEW.country != '' THEN
    NEW.country := normalize_country_name(NEW.country);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_talent_country
  BEFORE INSERT OR UPDATE OF country ON public.talents
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_talent_country();

-- Part 5: Alter credit columns to numeric for fractional credits
ALTER TABLE public.talent_credits 
  ALTER COLUMN balance TYPE numeric(12,1) USING balance::numeric(12,1),
  ALTER COLUMN earned_balance TYPE numeric(12,1) USING earned_balance::numeric(12,1);

ALTER TABLE public.credit_transactions 
  ALTER COLUMN amount TYPE numeric(12,1) USING amount::numeric(12,1),
  ALTER COLUMN balance_after TYPE numeric(12,1) USING balance_after::numeric(12,1);

-- Update deduct_credits to accept numeric amounts
CREATE OR REPLACE FUNCTION public.deduct_credits(p_amount numeric, p_service_type text, p_reference_id text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_talent_id uuid;
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  SELECT id INTO v_talent_id
  FROM talents
  WHERE user_id = auth.uid();
  
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  SELECT balance INTO v_current_balance
  FROM talent_credits
  WHERE talent_id = v_talent_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit balance found');
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', p_amount,
      'available', v_current_balance
    );
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  UPDATE talent_credits
  SET balance = v_new_balance
  WHERE talent_id = v_talent_id;
  
  INSERT INTO credit_transactions (
    talent_id,
    amount,
    balance_after,
    transaction_type,
    service_type,
    reference_id,
    description
  ) VALUES (
    v_talent_id,
    -p_amount,
    v_new_balance,
    'service_usage',
    p_service_type,
    CASE WHEN p_reference_id IS NOT NULL AND p_reference_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN p_reference_id::uuid 
         ELSE NULL 
    END,
    COALESCE(p_description, 'Service: ' || p_service_type)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
END;
$function$;
