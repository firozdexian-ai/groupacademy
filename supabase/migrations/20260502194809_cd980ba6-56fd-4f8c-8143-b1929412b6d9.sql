
CREATE TYPE public.crm_lead_stage AS ENUM ('new','contacted','qualified','proposal','won','lost');
CREATE TYPE public.crm_activity_type AS ENUM ('note','call','email','meeting','task');

CREATE TABLE public.company_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text, phone text, company_name text, title text, source text,
  stage public.crm_lead_stage NOT NULL DEFAULT 'new',
  value_usd numeric(12,2) DEFAULT 0,
  owner_user_id uuid, notes text, next_action_at timestamptz, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_leads_company ON public.company_leads(company_id);
CREATE INDEX idx_company_leads_stage ON public.company_leads(company_id, stage);
ALTER TABLE public.company_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view leads" ON public.company_leads FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Members insert leads" ON public.company_leads FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Members update leads" ON public.company_leads FOR UPDATE TO authenticated
USING (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()))
WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Members delete leads" ON public.company_leads FOR DELETE TO authenticated
USING (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));

CREATE TRIGGER trg_company_leads_updated BEFORE UPDATE ON public.company_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.company_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.company_leads(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_type public.crm_activity_type NOT NULL DEFAULT 'note',
  body text NOT NULL, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_activities_lead ON public.company_lead_activities(lead_id, created_at DESC);
ALTER TABLE public.company_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view activities" ON public.company_lead_activities FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Members insert activities" ON public.company_lead_activities FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Members delete own activities" ON public.company_lead_activities FOR DELETE TO authenticated
USING ((created_by = auth.uid()) OR public.has_any_admin_role(auth.uid()));

CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'university',
  country text, website text,
  contact_name text, contact_email text, contact_phone text,
  status text NOT NULL DEFAULT 'prospect',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage institutions" ON public.institutions FOR ALL TO authenticated
USING (public.has_any_admin_role(auth.uid())) WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE TRIGGER trg_institutions_updated BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.partner_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'ngo',
  country text, website text,
  contact_name text, contact_email text, contact_phone text,
  status text NOT NULL DEFAULT 'prospect',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partner orgs" ON public.partner_organizations FOR ALL TO authenticated
USING (public.has_any_admin_role(auth.uid())) WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE TRIGGER trg_partner_orgs_updated BEFORE UPDATE ON public.partner_organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
