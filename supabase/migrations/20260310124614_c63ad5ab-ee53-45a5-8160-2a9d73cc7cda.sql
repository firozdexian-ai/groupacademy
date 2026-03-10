
-- Add lead_config column to company_agents
ALTER TABLE public.company_agents 
ADD COLUMN lead_config jsonb DEFAULT '{"enabled": false, "fields": ["name", "email"], "notification_email": null}'::jsonb;

-- Create company_agent_leads table
CREATE TABLE public.company_agent_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_agent_id uuid REFERENCES public.company_agents(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  lead_name text,
  lead_email text,
  lead_phone text,
  lead_company text,
  lead_interest text,
  session_id uuid REFERENCES public.agent_chat_sessions(id) ON DELETE SET NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_agent_leads ENABLE ROW LEVEL SECURITY;

-- Admin-only policy
CREATE POLICY "Admins can manage company agent leads"
ON public.company_agent_leads FOR ALL TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));
