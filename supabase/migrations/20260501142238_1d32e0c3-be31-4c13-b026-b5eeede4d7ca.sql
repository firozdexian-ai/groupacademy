-- 1. Wire allowed_tools for career agents
UPDATE public.ai_agents SET allowed_tools = ARRAY['suggest_jobs','score_job_match','search_kb']
  WHERE agent_key = 'job-hunter';
UPDATE public.ai_agents SET allowed_tools = ARRAY['parse_cv','search_kb']
  WHERE agent_key = 'cv-coach';
UPDATE public.ai_agents SET allowed_tools = ARRAY['enhance_cover_letter','prepare_external_app','score_job_match','parse_cv']
  WHERE agent_key = 'application-helper';
UPDATE public.ai_agents SET allowed_tools = ARRAY['generate_interview_q','analyze_interview','search_kb']
  WHERE agent_key = 'interview-coach';
UPDATE public.ai_agents SET allowed_tools = ARRAY['score_job_match','analyze_job_market','search_kb']
  WHERE agent_key = 'career-consultant';
UPDATE public.ai_agents SET allowed_tools = ARRAY['suggest_jobs','score_job_match','search_kb']
  WHERE agent_key = 'remote-expert';
UPDATE public.ai_agents SET allowed_tools = ARRAY['analyze_job_market','search_kb','suggest_jobs']
  WHERE agent_key = 'career-abroad';

-- 2. Soften region-specific phrasing in agent prompts (keep tone, drop BD-only clauses)
UPDATE public.ai_agents
  SET system_prompt = regexp_replace(system_prompt, 'for professionals in Bangladesh', 'for professionals worldwide', 'g')
  WHERE agent_key IN ('career-consultant','cv-coach');

UPDATE public.ai_agents
  SET system_prompt = regexp_replace(system_prompt, 'for the Bangladesh job market', 'for the global job market', 'g')
  WHERE agent_key = 'cv-coach';

UPDATE public.ai_agents
  SET system_prompt = regexp_replace(system_prompt, 'Bangladesh', 'the talent''s local market', 'g')
  WHERE agent_key IN ('career-consultant','cv-coach','job-hunter');

-- 3. Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  amount_credits numeric(12,1) NOT NULL CHECK (amount_credits > 0),
  method text NOT NULL CHECK (method IN ('bkash','bank','paypal','wise')),
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_talent ON public.withdrawal_requests(talent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status, created_at DESC);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent can read own withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Talent can insert own withdrawal"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));
