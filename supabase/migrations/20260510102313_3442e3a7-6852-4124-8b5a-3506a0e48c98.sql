-- 1. Canonical Countries
CREATE TABLE IF NOT EXISTS public.gtm_countries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  iso2 text UNIQUE NOT NULL,
  name text UNIQUE NOT NULL,
  tier text DEFAULT 'Tier 3',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. States/Regions
CREATE TABLE IF NOT EXISTS public.gtm_regions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id uuid REFERENCES public.gtm_countries(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  created_at timestamptz DEFAULT now()
);

-- 3. Cities
CREATE TABLE IF NOT EXISTS public.gtm_cities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id uuid REFERENCES public.gtm_regions(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_gtm_regions_country ON public.gtm_regions(country_id);
CREATE INDEX IF NOT EXISTS idx_gtm_cities_region ON public.gtm_cities(region_id);

-- 5. RLS
ALTER TABLE public.gtm_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_regions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_cities    ENABLE ROW LEVEL SECURITY;

-- Authenticated read access (used widely by app for dropdowns / filters)
CREATE POLICY "gtm_countries_read_auth" ON public.gtm_countries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gtm_regions_read_auth" ON public.gtm_regions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gtm_cities_read_auth" ON public.gtm_cities
  FOR SELECT TO authenticated USING (true);

-- Admin-only writes (uses existing has_role + app_role enum)
CREATE POLICY "gtm_countries_admin_write" ON public.gtm_countries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "gtm_regions_admin_write" ON public.gtm_regions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "gtm_cities_admin_write" ON public.gtm_cities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));