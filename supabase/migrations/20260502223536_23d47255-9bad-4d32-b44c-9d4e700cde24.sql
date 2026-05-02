-- Riya conversations (mirror of aisha_conversations, for B2B)
CREATE TABLE IF NOT EXISTS public.riya_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  last_step text,
  payload jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_riya_conv_completed ON public.riya_conversations (completed_at);
CREATE INDEX IF NOT EXISTS idx_riya_conv_created ON public.riya_conversations (created_at DESC);
ALTER TABLE public.riya_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read riya_conversations"
ON public.riya_conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_riya_conv_updated_at
BEFORE UPDATE ON public.riya_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Company outreach log (parallel to talent_outreach_log)
CREATE TABLE IF NOT EXISTS public.company_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  message text,
  status text NOT NULL DEFAULT 'sent',
  template text,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  response_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_company_outreach_contact ON public.company_outreach_log (contact_id);
CREATE INDEX IF NOT EXISTS idx_company_outreach_sent ON public.company_outreach_log (sent_at DESC);
ALTER TABLE public.company_outreach_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage company_outreach_log"
ON public.company_outreach_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Indexes for unregistered/source-segmented contacts (keep ContactsManager tabs fast)
CREATE INDEX IF NOT EXISTS idx_contacts_unregistered ON public.contacts (created_at DESC) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_source ON public.contacts (source);

-- Notify admins when a new company is created
CREATE OR REPLACE FUNCTION public.notify_admin_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, metadata)
  VALUES (
    'company_signup',
    'New company registered',
    COALESCE(NEW.name, 'Unnamed company'),
    jsonb_build_object('company_id', NEW.id, 'industry', NEW.industry, 'country', NEW.country)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_new_company ON public.companies;
CREATE TRIGGER trg_notify_admin_new_company
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_company();