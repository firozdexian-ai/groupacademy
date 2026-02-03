-- 1. Monthly KPI Targets (with service mix)
CREATE TABLE public.ir_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  mrr_target_usd DECIMAL(12,2) NOT NULL,
  
  -- Service mix percentages (configurable)
  service_mix JSONB DEFAULT '{
    "AI_AGENT_CHAT": 30,
    "JOB_MATCH_SCORE": 15,
    "JOB_APPLICATION": 15,
    "CAREER_ASSESSMENT": 10,
    "MOCK_INTERVIEW": 10,
    "SALARY_ANALYSIS": 8,
    "JOB_MARKET_INSIGHT": 5,
    "IELTS_MOCK": 3,
    "STUDY_ABROAD_ROADMAP": 3,
    "PORTFOLIO": 1
  }',
  
  -- Other targets
  target_paying_users INTEGER,
  target_churn_rate DECIMAL(5,2) DEFAULT 5,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VC Firms
CREATE TABLE public.ir_vc_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  stage_focus TEXT[],
  sector_focus TEXT[],
  website TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'prospecting',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Investors (enhanced with context fields)
CREATE TABLE public.ir_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vc_firm_id UUID REFERENCES public.ir_vc_firms(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  
  -- Context for AI personalization
  investor_interests TEXT[],
  investment_stage_pref TEXT,
  relationship_summary TEXT,
  last_feedback_summary TEXT,
  
  subscription_status TEXT DEFAULT 'pending',
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Investor Interactions (conversation history)
CREATE TABLE public.ir_investor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES public.ir_investors(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  sentiment TEXT,
  key_points TEXT[],
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Email Communications (sent emails with tracking)
CREATE TABLE public.ir_email_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES public.ir_investors(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  ai_generated BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft',
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Metrics Snapshots (for tracking progress over time)
CREATE TABLE public.ir_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  mrr_usd DECIMAL(12,2),
  arr_usd DECIMAL(12,2),
  total_credits_consumed INTEGER,
  paying_users INTEGER,
  total_users INTEGER,
  mom_growth_rate DECIMAL(5,2),
  service_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ir_monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_vc_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_investor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_email_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access for all IR tables
CREATE POLICY "Admins can manage IR targets"
ON public.ir_monthly_targets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage VC firms"
ON public.ir_vc_firms FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage investors"
ON public.ir_investors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage investor interactions"
ON public.ir_investor_interactions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email communications"
ON public.ir_email_communications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage metrics snapshots"
ON public.ir_metrics_snapshots FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update triggers
CREATE TRIGGER update_ir_monthly_targets_updated_at
BEFORE UPDATE ON public.ir_monthly_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ir_vc_firms_updated_at
BEFORE UPDATE ON public.ir_vc_firms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ir_investors_updated_at
BEFORE UPDATE ON public.ir_investors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();