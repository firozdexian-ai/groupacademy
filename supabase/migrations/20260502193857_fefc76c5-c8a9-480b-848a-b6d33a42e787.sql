-- ============================================================
-- BLOCK A: Currency rates table (USD base)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.currency_rates (
  code text PRIMARY KEY,
  symbol text NOT NULL,
  name text NOT NULL,
  usd_rate numeric(14,6) NOT NULL, -- 1 USD = N units of this currency
  country_codes text[] DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read currency rates"
  ON public.currency_rates FOR SELECT USING (true);

CREATE POLICY "Admins manage currency rates"
  ON public.currency_rates FOR ALL
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

INSERT INTO public.currency_rates (code, symbol, name, usd_rate, country_codes) VALUES
  ('USD','$','US Dollar',1.00,ARRAY['United States','Ecuador','El Salvador']),
  ('EUR','€','Euro',0.92,ARRAY['Germany','France','Italy','Spain','Netherlands','Belgium','Austria','Portugal','Ireland','Finland','Greece']),
  ('GBP','£','British Pound',0.79,ARRAY['United Kingdom']),
  ('BDT','৳','Bangladeshi Taka',110.00,ARRAY['Bangladesh']),
  ('INR','₹','Indian Rupee',83.50,ARRAY['India']),
  ('PKR','₨','Pakistani Rupee',278.00,ARRAY['Pakistan']),
  ('NPR','₨','Nepalese Rupee',133.00,ARRAY['Nepal']),
  ('LKR','₨','Sri Lankan Rupee',300.00,ARRAY['Sri Lanka']),
  ('AED','د.إ','UAE Dirham',3.67,ARRAY['United Arab Emirates']),
  ('SAR','﷼','Saudi Riyal',3.75,ARRAY['Saudi Arabia']),
  ('QAR','﷼','Qatari Riyal',3.64,ARRAY['Qatar']),
  ('CAD','C$','Canadian Dollar',1.36,ARRAY['Canada']),
  ('AUD','A$','Australian Dollar',1.52,ARRAY['Australia']),
  ('NZD','NZ$','New Zealand Dollar',1.65,ARRAY['New Zealand']),
  ('SGD','S$','Singapore Dollar',1.34,ARRAY['Singapore']),
  ('MYR','RM','Malaysian Ringgit',4.70,ARRAY['Malaysia']),
  ('IDR','Rp','Indonesian Rupiah',15800.00,ARRAY['Indonesia']),
  ('PHP','₱','Philippine Peso',56.00,ARRAY['Philippines']),
  ('THB','฿','Thai Baht',35.50,ARRAY['Thailand']),
  ('VND','₫','Vietnamese Dong',24500.00,ARRAY['Vietnam']),
  ('JPY','¥','Japanese Yen',150.00,ARRAY['Japan']),
  ('CNY','¥','Chinese Yuan',7.25,ARRAY['China']),
  ('KRW','₩','South Korean Won',1340.00,ARRAY['South Korea']),
  ('NGN','₦','Nigerian Naira',1500.00,ARRAY['Nigeria']),
  ('KES','KSh','Kenyan Shilling',129.00,ARRAY['Kenya']),
  ('ZAR','R','South African Rand',18.50,ARRAY['South Africa']),
  ('EGP','E£','Egyptian Pound',49.00,ARRAY['Egypt']),
  ('TRY','₺','Turkish Lira',34.00,ARRAY['Turkey']),
  ('BRL','R$','Brazilian Real',5.05,ARRAY['Brazil']),
  ('MXN','$','Mexican Peso',17.20,ARRAY['Mexico']),
  ('CHF','CHF','Swiss Franc',0.88,ARRAY['Switzerland'])
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- BLOCK C (foundation): Verification tier enum + completion %
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.company_verification_tier AS ENUM ('unverified','self_completed','verified');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_tier public.company_verification_tier NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS profile_completion smallint NOT NULL DEFAULT 0;

-- Recompute completion% based on filled fields. Pure function, no SECURITY DEFINER needed.
CREATE OR REPLACE FUNCTION public.compute_company_profile_completion(c public.companies)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  filled int := 0;
  total  int := 10;
BEGIN
  IF c.logo_url      IS NOT NULL AND length(c.logo_url) > 0      THEN filled := filled + 1; END IF;
  IF c.banner_url    IS NOT NULL AND length(c.banner_url) > 0    THEN filled := filled + 1; END IF;
  IF c.tagline       IS NOT NULL AND length(c.tagline) > 0       THEN filled := filled + 1; END IF;
  IF c.about         IS NOT NULL AND length(c.about) > 20        THEN filled := filled + 1; END IF;
  IF c.website       IS NOT NULL AND length(c.website) > 0       THEN filled := filled + 1; END IF;
  IF c.country       IS NOT NULL AND length(c.country) > 0       THEN filled := filled + 1; END IF;
  IF c.industry      IS NOT NULL AND length(c.industry) > 0      THEN filled := filled + 1; END IF;
  IF c.address       IS NOT NULL AND length(c.address) > 0       THEN filled := filled + 1; END IF;
  IF c.primary_email IS NOT NULL AND length(c.primary_email) > 0 THEN filled := filled + 1; END IF;
  IF c.operating_hours IS NOT NULL AND c.operating_hours <> '{}'::jsonb THEN filled := filled + 1; END IF;
  RETURN (filled * 100 / total)::smallint;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_company_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  pct smallint;
BEGIN
  pct := public.compute_company_profile_completion(NEW);
  NEW.profile_completion := pct;
  -- Auto-promote to self_completed at ≥80%, but never demote a manually-verified company.
  IF NEW.verification_tier = 'unverified' AND pct >= 80 THEN
    NEW.verification_tier := 'self_completed';
  ELSIF NEW.verification_tier = 'self_completed' AND pct < 80 THEN
    NEW.verification_tier := 'unverified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_profile_completion ON public.companies;
CREATE TRIGGER trg_company_profile_completion
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_company_profile_completion();

-- Backfill existing rows
UPDATE public.companies SET updated_at = updated_at;