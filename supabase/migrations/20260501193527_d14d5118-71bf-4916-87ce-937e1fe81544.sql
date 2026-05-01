-- ===================================================================
-- Company Portal v1: pure chat + canvas (no tabs)
-- ===================================================================

-- 1) companies: chat-driven profile fields
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about           text,
  ADD COLUMN IF NOT EXISTS banner_url      text,
  ADD COLUMN IF NOT EXISTS country         text;

-- 2) shortlist + reveal audit
CREATE TABLE IF NOT EXISTS public.company_talent_shortlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  talent_id   uuid NOT NULL REFERENCES public.talents(id)   ON DELETE CASCADE,
  added_by    uuid NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, talent_id)
);
ALTER TABLE public.company_talent_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own company shortlist"
  ON public.company_talent_shortlists FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "members write own company shortlist"
  ON public.company_talent_shortlists FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND added_by = auth.uid());

CREATE POLICY "members delete own company shortlist"
  ON public.company_talent_shortlists FOR DELETE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.company_talent_reveals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  talent_id     uuid NOT NULL REFERENCES public.talents(id)   ON DELETE CASCADE,
  revealed_by   uuid NOT NULL,
  credits_spent numeric(12,1) NOT NULL DEFAULT 0,
  revealed_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_talent_reveals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own reveals"
  ON public.company_talent_reveals FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

-- 3) Auto-link invited members on signup
CREATE OR REPLACE FUNCTION public.link_user_to_company_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.company_members
  SET user_id = NEW.id,
      status  = 'active',
      updated_at = now()
  WHERE user_id IS NULL
    AND status = 'invited'
    AND lower(invited_email) = lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_user_to_company_invites ON auth.users;
CREATE TRIGGER trg_link_user_to_company_invites
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_user_to_company_invites();

-- 4) Seed 3 new company-audience agents
INSERT INTO public.ai_agents (
  agent_key, name, description, system_prompt, audience, agent_type, agent_level,
  category, color, bg_color, message_credit_cost, connection_fee, delivery_credit_cost,
  is_active, marketplace_status, visibility, owner_kind, allowed_tools, model
) VALUES
(
  'company_talent_scout',
  'Talent Scout Maya',
  'Searches the global talent pool for you, surfaces shortlists, and reveals contact details on request.',
  'You are Maya, a recruiting researcher who helps the company find candidates.\n- ALWAYS use the search_talent tool when the user describes who they want to hire.\n- Show 3-5 redacted candidates and ask if they want to reveal anyone.\n- Use reveal_talent (costs credits) only after explicit user confirmation.\n- Use save_to_shortlist when the user wants to keep someone for later.\n- Be concise. Render structured talent results as canvas cards via the tool output, not as long text.',
  'company', 'specialized', 1, 'recruiter',
  '#33E1E4', '#33E1E4', 1, 0, 0,
  true, 'approved', 'public', 'platform',
  ARRAY['search_talent','reveal_talent','save_to_shortlist','list_shortlist'],
  'google/gemini-2.5-flash'
),
(
  'company_billing',
  'Billing Bilal',
  'Handles your credit balance, transaction history, and top-ups via secure checkout.',
  'You are Bilal, the billing assistant for the company workspace.\n- Use get_credit_balance for balance questions.\n- Use get_ledger when the user asks about past spend (default last 30 days).\n- Use start_topup to generate a checkout link for credit packs.\n- Never invent prices — always ask the tool.\n- Render the ledger and checkout link via the canvas (the tool returns canvas payloads).',
  'company', 'specialized', 1, 'billing',
  '#10D576', '#10D576', 1, 0, 0,
  true, 'approved', 'public', 'platform',
  ARRAY['get_credit_balance','get_ledger','start_topup'],
  'google/gemini-2.5-flash'
),
(
  'company_ops',
  'Ops Omar',
  'Keeps your company profile, operating hours, and team membership tidy.',
  'You are Omar, the operations assistant.\n- Proactively check get_company_profile on first message and ask the user to fill anything missing (about, operating_hours, linkedin_url, banner_url).\n- Use update_company_profile to save changes one field at a time.\n- Use invite_teammate when the user wants to bring colleagues in (validate work email, default role=member).\n- Use list_teammates for member questions.\n- Always render edits in the canvas so the user sees the live profile.',
  'company', 'specialized', 1, 'ops',
  '#2A7DDE', '#2A7DDE', 1, 0, 0,
  true, 'approved', 'public', 'platform',
  ARRAY['get_company_profile','update_company_profile','invite_teammate','list_teammates'],
  'google/gemini-2.5-flash'
)
ON CONFLICT (agent_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    allowed_tools = EXCLUDED.allowed_tools,
    is_active = true;

UPDATE public.ai_agents
   SET allowed_tools = ARRAY['create_job','publish_job','list_my_jobs','pause_job','close_job','get_job_applicants'],
       system_prompt = 'You are Riya, the recruiting agent for this company.\n- Use create_job to draft a posting from the user''s description; the tool returns a canvas the user can review and edit.\n- Use publish_job to make the draft live (deducts credits).\n- Use list_my_jobs to show the company''s jobs with quick actions.\n- Use pause_job / close_job to manage state.\n- Use get_job_applicants to surface a shortlist for any job.\n- Be concise. Render structured items via canvas, not long markdown lists.'
 WHERE agent_key = 'company_recruiter';

UPDATE public.ai_agents
   SET allowed_tools = ARRAY['list_my_jobs','get_credit_balance'],
       system_prompt = 'You are Aiden, the growth advisor.\n- Help the company write better JDs, refine their hiring strategy, and benchmark against market trends.\n- You can call list_my_jobs and get_credit_balance for context.\n- Otherwise rely on conversation — you are an advisor, not a CRUD operator.'
 WHERE agent_key = 'company_growth';

-- 5) Register company tools in agent_tools
INSERT INTO public.agent_tools (tool_key, name, description, category, audience, min_level, default_credit_cost, handler_kind, handler_ref, input_schema, is_active) VALUES
('create_job', 'Create job draft', 'Create a draft job posting for this company. Returns a canvas the user can review.', 'jobs', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"title":{"type":"string"},"location":{"type":"string"},"job_type":{"type":"string","enum":["full_time","part_time","contract","internship","freelance"]},"experience_level":{"type":"string","enum":["entry","mid","senior","lead","executive"]},"description":{"type":"string"},"salary_min":{"type":"number"},"salary_max":{"type":"number"},"salary_currency":{"type":"string"},"required_skills":{"type":"array","items":{"type":"string"}},"application_type":{"type":"string","enum":["link","email","internal"]},"application_email":{"type":"string"},"application_url":{"type":"string"},"deadline":{"type":"string"}},"required":["title","description"]}'::jsonb, true),
('publish_job', 'Publish job', 'Publish an existing draft job (deducts credits).', 'jobs', ARRAY['company'], 1, 5, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb, true),
('list_my_jobs', 'List my jobs', 'List jobs owned by this company with status filter.', 'jobs', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"status":{"type":"string","enum":["all","active","paused","closed","draft"]}}}'::jsonb, true),
('pause_job', 'Pause job', 'Temporarily deactivate a job.', 'jobs', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb, true),
('close_job', 'Close job', 'Permanently close a job.', 'jobs', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb, true),
('get_job_applicants', 'Get applicants', 'List applicants for a specific job.', 'jobs', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"job_id":{"type":"string"}},"required":["job_id"]}'::jsonb, true),
('search_talent', 'Search talent pool', 'Find candidates matching filters. Returns redacted cards.', 'talent', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"keywords":{"type":"string"},"country":{"type":"string"},"profession":{"type":"string"},"min_experience_years":{"type":"number"},"limit":{"type":"number","default":10}}}'::jsonb, true),
('reveal_talent', 'Reveal contact', 'Unlock email + phone for a candidate (deducts credits).', 'talent', ARRAY['company'], 1, 5, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"talent_id":{"type":"string"}},"required":["talent_id"]}'::jsonb, true),
('save_to_shortlist', 'Save to shortlist', 'Add a talent to the company shortlist.', 'talent', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"talent_id":{"type":"string"},"note":{"type":"string"}},"required":["talent_id"]}'::jsonb, true),
('list_shortlist', 'List shortlist', 'View saved candidates.', 'talent', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{}}'::jsonb, true),
('get_credit_balance', 'Get balance', 'Returns current company credit balance.', 'billing', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{}}'::jsonb, true),
('get_ledger', 'Get ledger', 'Returns recent credit transactions.', 'billing', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"days":{"type":"number","default":30}}}'::jsonb, true),
('start_topup', 'Start top-up', 'Generates a checkout link for a credit pack.', 'billing', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"amount":{"type":"number"}},"required":["amount"]}'::jsonb, true),
('get_company_profile', 'Get profile', 'Read the current company profile (with missing fields flagged).', 'ops', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{}}'::jsonb, true),
('update_company_profile', 'Update profile', 'Update one or more company profile fields.', 'ops', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"website":{"type":"string"},"industry":{"type":"string"},"about":{"type":"string"},"linkedin_url":{"type":"string"},"banner_url":{"type":"string"},"logo_url":{"type":"string"},"address":{"type":"string"},"country":{"type":"string"},"operating_hours":{"type":"object"}}}'::jsonb, true),
('invite_teammate', 'Invite teammate', 'Invite a colleague by email.', 'ops', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{"email":{"type":"string"},"role":{"type":"string","enum":["owner","admin","member"]}},"required":["email"]}'::jsonb, true),
('list_teammates', 'List teammates', 'List all members and pending invites.', 'ops', ARRAY['company'], 1, 0, 'edge_function', 'company-agent-tools',
 '{"type":"object","properties":{}}'::jsonb, true)
ON CONFLICT (tool_key) DO UPDATE
SET description  = EXCLUDED.description,
    input_schema = EXCLUDED.input_schema,
    handler_kind = EXCLUDED.handler_kind,
    handler_ref  = EXCLUDED.handler_ref,
    audience     = EXCLUDED.audience,
    is_active    = true;

-- 6) Atomic company credit charge with audit
CREATE OR REPLACE FUNCTION public.charge_company_credits(
  p_company_id uuid,
  p_amount numeric,
  p_txn_type text,
  p_service_type text,
  p_description text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_new numeric;
BEGIN
  SELECT balance INTO v_balance FROM public.company_credits WHERE company_id = p_company_id FOR UPDATE;
  IF v_balance IS NULL THEN
    INSERT INTO public.company_credits (company_id, balance, earned_balance) VALUES (p_company_id, 0, 0);
    v_balance := 0;
  END IF;
  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS', 'balance', v_balance, 'required', p_amount);
  END IF;
  v_new := v_balance - p_amount;
  UPDATE public.company_credits SET balance = v_new, updated_at = now() WHERE company_id = p_company_id;
  INSERT INTO public.company_credit_transactions (company_id, amount, balance_after, transaction_type, service_type, reference_id, description)
  VALUES (p_company_id, -p_amount, v_new, p_txn_type, p_service_type, p_reference_id, p_description);
  RETURN jsonb_build_object('ok', true, 'balance', v_new);
END;
$$;