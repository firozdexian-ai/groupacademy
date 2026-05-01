-- ============================================================
-- Self-Serve Company Signup: DB foundations
-- ============================================================

-- 1) Drop the approval-pipeline table (no rows currently)
DROP TABLE IF EXISTS public.company_onboarding_requests CASCADE;

-- 2) Ensure trigram extension for fuzzy company-name match
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- 3) Helper: extract a normalized root domain from a website URL
CREATE OR REPLACE FUNCTION public.normalize_company_website(p_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE v text;
BEGIN
  IF p_url IS NULL OR btrim(p_url) = '' THEN RETURN NULL; END IF;
  v := lower(btrim(p_url));
  v := regexp_replace(v, '^https?://', '');
  v := regexp_replace(v, '^www\.', '');
  v := split_part(v, '/', 1);
  v := split_part(v, '?', 1);
  v := split_part(v, '#', 1);
  RETURN nullif(btrim(v), '');
END;
$$;

-- 4) Helper: normalize a company name for comparison
CREATE OR REPLACE FUNCTION public.normalize_company_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE v text;
BEGIN
  IF p_name IS NULL THEN RETURN NULL; END IF;
  v := lower(btrim(p_name));
  -- strip common suffixes
  v := regexp_replace(v, '[\.,]', '', 'g');
  v := regexp_replace(v, '\s+(ltd|limited|inc|incorporated|llc|llp|pvt|private|pte|plc|gmbh|sa|srl|co|company|corp|corporation)\.?$', '', 'g');
  v := regexp_replace(v, '\s+', ' ', 'g');
  RETURN btrim(v);
END;
$$;

-- 5) find-or-create with enrichment
CREATE OR REPLACE FUNCTION public.find_or_create_company(
  p_name text,
  p_website text DEFAULT NULL,
  p_industry text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_norm_name text := public.normalize_company_name(p_name);
  v_root_domain text := public.normalize_company_website(p_website);
BEGIN
  IF v_norm_name IS NULL OR v_norm_name = '' THEN
    RAISE EXCEPTION 'Company name required';
  END IF;

  -- 1) Match by website root domain (most reliable)
  IF v_root_domain IS NOT NULL THEN
    SELECT id INTO v_id FROM public.companies
    WHERE public.normalize_company_website(website) = v_root_domain
    LIMIT 1;
  END IF;

  -- 2) Exact normalized name
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.companies
    WHERE public.normalize_company_name(name) = v_norm_name
    LIMIT 1;
  END IF;

  -- 3) Trigram fuzzy match >= 0.85
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.companies
    WHERE similarity(public.normalize_company_name(name), v_norm_name) >= 0.85
    ORDER BY similarity(public.normalize_company_name(name), v_norm_name) DESC
    LIMIT 1;
  END IF;

  IF v_id IS NOT NULL THEN
    -- Enrich missing fields, mark verified
    UPDATE public.companies
    SET website  = COALESCE(website,  p_website),
        industry = COALESCE(industry, p_industry),
        address  = COALESCE(address,  p_country),
        is_verified = true,
        updated_at = now()
    WHERE id = v_id;
    RETURN v_id;
  END IF;

  -- 4) Create new
  INSERT INTO public.companies (name, website, industry, address, is_verified)
  VALUES (btrim(p_name), p_website, p_industry, p_country, true)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 6) Idempotent welcome credit grant (only first time)
CREATE OR REPLACE FUNCTION public.grant_company_welcome_credits(p_company_id uuid, p_amount numeric DEFAULT 250)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM public.company_credits WHERE company_id = p_company_id;
  IF v_existing IS NOT NULL THEN
    RETURN false; -- already granted
  END IF;

  INSERT INTO public.company_credits (company_id, balance, earned_balance)
  VALUES (p_company_id, p_amount, 0);

  INSERT INTO public.company_credit_transactions (
    company_id, amount, balance_after, transaction_type, description
  )
  SELECT p_company_id, p_amount, p_amount, 'welcome_bonus',
         'Welcome bonus — ' || p_amount || ' credits to get started'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='company_credit_transactions'
                  AND column_name='transaction_type');
  RETURN true;
END;
$$;

-- 7) Seed 2 starter company-audience agents
INSERT INTO public.ai_agents (
  agent_key, name, description, system_prompt,
  audience, agent_type, owner_kind, visibility, marketplace_status,
  is_active, agent_level, display_order, category, color, bg_color, icon,
  message_credit_cost, delivery_credit_cost, connection_fee
)
VALUES
(
  'company_recruiter',
  'Recruiter Riya',
  'Helps you post jobs, screen applicants, and search the talent network.',
  'You are Recruiter Riya, a friendly senior recruiter helping a company hiring team. You help users post job openings, write attractive job descriptions, screen candidates, search the talent network by skills/profession/country, and shortlist candidates. Be concise, action-oriented, and ask clarifying questions when needed. Always confirm before taking irreversible actions.',
  'company', 'company', 'platform', 'public', 'approved',
  true, 1, 1, 'recruiting', '#2A7DDE', '#2A7DDE', 'briefcase',
  0.5, 1.0, 0
),
(
  'company_growth',
  'Growth Advisor Aiden',
  'Helps with employer branding, outreach campaigns, and finding the right talent pools.',
  'You are Growth Advisor Aiden, a B2B growth strategist helping a company strengthen its employer brand and find the right talent pools. You help craft outreach campaigns, suggest content for the company page, identify best-fit talent segments by profession and geography, and benchmark salaries. Be practical, data-aware, and concise.',
  'company', 'company', 'platform', 'public', 'approved',
  true, 1, 2, 'growth', '#33E1E4', '#33E1E4', 'sparkles',
  0.5, 1.0, 0
)
ON CONFLICT (agent_key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      system_prompt = EXCLUDED.system_prompt,
      audience = EXCLUDED.audience,
      agent_type = EXCLUDED.agent_type,
      visibility = EXCLUDED.visibility,
      marketplace_status = EXCLUDED.marketplace_status,
      is_active = true,
      display_order = EXCLUDED.display_order;
