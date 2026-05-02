
-- 1. B2B tagging on content
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS is_b2b boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2b_audience text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_content_is_b2b ON public.content(is_b2b) WHERE is_b2b = true;

-- 2. company_course_assignments
CREATE TABLE IF NOT EXISTS public.company_course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  assigned_to uuid NULL,
  due_at timestamptz NULL,
  sponsorship_mode text NOT NULL CHECK (sponsorship_mode IN ('free','company_credits','employee_credits')),
  credit_cost numeric(12,1) NOT NULL DEFAULT 0,
  note text NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, content_id, assigned_to)
);

CREATE INDEX IF NOT EXISTS idx_cca_company ON public.company_course_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_cca_assignee ON public.company_course_assignments(assigned_to);

ALTER TABLE public.company_course_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own company assignments" ON public.company_course_assignments;
CREATE POLICY "Members read own company assignments"
  ON public.company_course_assignments FOR SELECT
  USING (
    public.is_company_member(auth.uid(), company_id)
    OR (assigned_to IS NOT NULL AND assigned_to = auth.uid())
    OR public.has_any_admin_role(auth.uid())
  );

DROP POLICY IF EXISTS "Owners manage assignments" ON public.company_course_assignments;
CREATE POLICY "Owners manage assignments"
  ON public.company_course_assignments FOR ALL
  USING (public.is_company_admin(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));

-- 3. company_course_sponsorships
CREATE TABLE IF NOT EXISTS public.company_course_sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.company_course_assignments(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  talent_id uuid NULL,
  user_id uuid NULL,
  credits_granted numeric(12,1) NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_ccs_assignment ON public.company_course_sponsorships(assignment_id);
CREATE INDEX IF NOT EXISTS idx_ccs_user ON public.company_course_sponsorships(user_id);

ALTER TABLE public.company_course_sponsorships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read sponsorships of own company" ON public.company_course_sponsorships;
CREATE POLICY "Members read sponsorships of own company"
  ON public.company_course_sponsorships FOR SELECT
  USING (
    public.is_company_member(auth.uid(), company_id)
    OR user_id = auth.uid()
    OR public.has_any_admin_role(auth.uid())
  );

DROP POLICY IF EXISTS "Owners manage sponsorships" ON public.company_course_sponsorships;
CREATE POLICY "Owners manage sponsorships"
  ON public.company_course_sponsorships FOR ALL
  USING (public.is_company_admin(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));

-- 4. company_offerings
CREATE TABLE IF NOT EXISTS public.company_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('service','product')),
  name text NOT NULL,
  tagline text NULL,
  description text NULL,
  price_min numeric NULL,
  price_max numeric NULL,
  currency text NOT NULL DEFAULT 'USD',
  unit text NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offerings_company ON public.company_offerings(company_id);
CREATE INDEX IF NOT EXISTS idx_offerings_active ON public.company_offerings(company_id, is_active);

ALTER TABLE public.company_offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active offerings" ON public.company_offerings;
CREATE POLICY "Public read active offerings"
  ON public.company_offerings FOR SELECT
  USING (
    is_active = true
    OR public.is_company_member(auth.uid(), company_id)
    OR public.has_any_admin_role(auth.uid())
  );

DROP POLICY IF EXISTS "Owners manage offerings" ON public.company_offerings;
CREATE POLICY "Owners manage offerings"
  ON public.company_offerings FOR ALL
  USING (public.is_company_admin(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));

-- 5. Extend company_leads (only what's missing)
ALTER TABLE public.company_leads
  ADD COLUMN IF NOT EXISTS offering_id uuid NULL REFERENCES public.company_offerings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_step text NULL;

-- 6. Sales context view
CREATE OR REPLACE VIEW public.v_company_sales_context
WITH (security_invoker = true)
AS
SELECT
  l.id AS lead_id,
  l.company_id,
  l.name,
  l.email,
  l.phone,
  l.company_name AS lead_company_name,
  l.title,
  l.stage,
  l.value_usd,
  l.next_action_at,
  l.next_step,
  o.id AS offering_id,
  o.name AS offering_name,
  o.kind AS offering_kind,
  o.price_min,
  o.price_max,
  o.currency,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'kind', a.kind,
      'body', a.body,
      'created_at', a.created_at
    ) ORDER BY a.created_at DESC)
    FROM (
      SELECT kind, body, created_at
      FROM public.company_lead_activities
      WHERE lead_id = l.id
      ORDER BY created_at DESC
      LIMIT 5
    ) a
  ) AS recent_activities
FROM public.company_leads l
LEFT JOIN public.company_offerings o ON o.id = l.offering_id;

-- 7. updated_at triggers
DROP TRIGGER IF EXISTS trg_cca_updated ON public.company_course_assignments;
CREATE TRIGGER trg_cca_updated BEFORE UPDATE ON public.company_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_offerings_updated ON public.company_offerings;
CREATE TRIGGER trg_offerings_updated BEFORE UPDATE ON public.company_offerings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Auto-grant employee bonus credits when assignment uses 'employee_credits'
CREATE OR REPLACE FUNCTION public.grant_assignment_sponsorship()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_talent_id uuid;
BEGIN
  IF NEW.sponsorship_mode = 'employee_credits' AND NEW.assigned_to IS NOT NULL AND NEW.credit_cost > 0 THEN
    SELECT id INTO v_talent_id FROM public.talents WHERE user_id = NEW.assigned_to LIMIT 1;

    INSERT INTO public.company_course_sponsorships (assignment_id, company_id, talent_id, user_id, credits_granted)
    VALUES (NEW.id, NEW.company_id, v_talent_id, NEW.assigned_to, NEW.credit_cost);

    IF v_talent_id IS NOT NULL THEN
      UPDATE public.talent_credits
        SET contact_bonus_balance = contact_bonus_balance + NEW.credit_cost,
            updated_at = now()
        WHERE talent_id = v_talent_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_grant_assignment_sponsorship ON public.company_course_assignments;
CREATE TRIGGER trg_grant_assignment_sponsorship
  AFTER INSERT ON public.company_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.grant_assignment_sponsorship();
