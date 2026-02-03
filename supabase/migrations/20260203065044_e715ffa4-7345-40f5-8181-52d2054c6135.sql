-- AI Agent Network Schema Extensions
-- Phase 2: Database Extensions for Rich Agent Profiles

-- Add new columns to ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'platform' CHECK (agent_type IN ('platform', 'company', 'specialized')),
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personality_traits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sample_conversations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_conversations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'career';

-- Create company_agents table for B2B Agent Sponsorship
CREATE TABLE IF NOT EXISTS public.company_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  sponsorship_type TEXT DEFAULT 'owned' CHECK (sponsorship_type IN ('owned', 'sponsored')),
  monthly_budget INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, agent_id)
);

-- Enable RLS on company_agents
ALTER TABLE public.company_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Admins can manage agents" ON public.ai_agents;

-- Users can see active agents
CREATE POLICY "Anyone can view active agents"
ON public.ai_agents FOR SELECT
USING (is_active = true);

-- Only admins can modify agents
CREATE POLICY "Admins can manage agents"
ON public.ai_agents FOR ALL
USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for company_agents
-- Anyone authenticated can view active company agents
CREATE POLICY "View active company agents"
ON public.company_agents FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can manage company agents
CREATE POLICY "Admins manage company agents"
ON public.company_agents FOR ALL
USING (public.has_any_admin_role(auth.uid()));

-- Create trigger for updated_at on company_agents
DROP TRIGGER IF EXISTS update_company_agents_updated_at ON public.company_agents;
CREATE TRIGGER update_company_agents_updated_at
BEFORE UPDATE ON public.company_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment agent conversation count
CREATE OR REPLACE FUNCTION public.increment_agent_conversations(p_agent_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_agents
  SET total_conversations = COALESCE(total_conversations, 0) + 1
  WHERE agent_key = p_agent_key;
END;
$$;

-- Update existing agents with categories (seed data)
UPDATE public.ai_agents SET category = 'career' WHERE agent_key IN ('career-consultant', 'cv-coach', 'interview-coach');
UPDATE public.ai_agents SET category = 'finance' WHERE agent_key = 'salary-negotiator';
UPDATE public.ai_agents SET category = 'education' WHERE agent_key IN ('ielts-tutor', 'skill-advisor', 'study-abroad-advisor');