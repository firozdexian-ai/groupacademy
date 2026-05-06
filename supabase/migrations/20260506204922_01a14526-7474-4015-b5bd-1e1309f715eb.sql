-- ============================================================
-- Phase 4.4 — Gro10x Learning Ops (B2B)
-- ============================================================

-- 1. Extend company_course_assignments
DO $$ BEGIN
  CREATE TYPE org_assignment_status AS ENUM ('invited','active','completed','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.company_course_assignments
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS talent_id uuid,
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status org_assignment_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS budget_credits numeric(12,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS overdue_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_cca_company_status ON public.company_course_assignments(company_id, status);
CREATE INDEX IF NOT EXISTS idx_cca_company_content ON public.company_course_assignments(company_id, content_id);
CREATE INDEX IF NOT EXISTS idx_cca_assigned_to ON public.company_course_assignments(assigned_to);

-- 2. Sponsor links
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS sponsor_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cohorts_sponsor ON public.cohorts(sponsor_company_id);

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES public.company_course_assignments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sponsor_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_sponsor ON public.enrollments(sponsor_company_id);

-- 3. Company learning seats (pre-purchased buckets)
CREATE TABLE IF NOT EXISTS public.company_learning_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
  seats_total integer NOT NULL DEFAULT 0,
  seats_used integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'purchase',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cls_company ON public.company_learning_seats(company_id);
CREATE INDEX IF NOT EXISTS idx_cls_content ON public.company_learning_seats(content_id);

ALTER TABLE public.company_learning_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members read seats" ON public.company_learning_seats;
CREATE POLICY "Company members read seats" ON public.company_learning_seats
  FOR SELECT USING (is_company_member(auth.uid(), company_id) OR has_any_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Company admins manage seats" ON public.company_learning_seats;
CREATE POLICY "Company admins manage seats" ON public.company_learning_seats
  FOR ALL USING (is_company_admin(auth.uid(), company_id) OR has_any_admin_role(auth.uid()))
  WITH CHECK (is_company_admin(auth.uid(), company_id) OR has_any_admin_role(auth.uid()));

CREATE TRIGGER trg_cls_updated_at
  BEFORE UPDATE ON public.company_learning_seats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Trigger: when an assignment is created, deduct from company wallet and emit ledger
CREATE OR REPLACE FUNCTION public.on_org_assignment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
BEGIN
  IF NEW.budget_credits > 0 THEN
    SELECT balance INTO v_balance FROM company_credits WHERE company_id = NEW.company_id FOR UPDATE;
    IF v_balance IS NULL THEN
      INSERT INTO company_credits (company_id, balance, earned_balance) VALUES (NEW.company_id, 0, 0);
      v_balance := 0;
    END IF;
    IF v_balance < NEW.budget_credits THEN
      RAISE EXCEPTION 'Insufficient company credits: have %, need %', v_balance, NEW.budget_credits;
    END IF;
    UPDATE company_credits
      SET balance = balance - NEW.budget_credits, updated_at = now()
      WHERE company_id = NEW.company_id;
    INSERT INTO company_credit_transactions (company_id, amount, balance_after, transaction_type, service_type, reference_id, description)
      VALUES (NEW.company_id, -NEW.budget_credits, v_balance - NEW.budget_credits, 'debit', 'learning_assignment', NEW.id,
        'Sponsored seat for course assignment');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_org_assignment_created ON public.company_course_assignments;
CREATE TRIGGER trg_org_assignment_created
  AFTER INSERT ON public.company_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.on_org_assignment_created();

-- 5. Trigger: when enrollment completes, mark assignment completed
CREATE OR REPLACE FUNCTION public.on_sponsored_enrollment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL) AND NEW.assignment_id IS NOT NULL THEN
    UPDATE company_course_assignments
      SET status = 'completed', completed_at = NEW.completed_at, updated_at = now()
      WHERE id = NEW.assignment_id AND status NOT IN ('completed','cancelled');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sponsored_enrollment_completed ON public.enrollments;
CREATE TRIGGER trg_sponsored_enrollment_completed
  AFTER UPDATE OF completed_at ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.on_sponsored_enrollment_completed();

-- 6. RPC: org_assign_talents
CREATE OR REPLACE FUNCTION public.org_assign_talents(
  p_company_id uuid,
  p_content_id uuid,
  p_cohort_id uuid,
  p_user_ids uuid[],
  p_due_at timestamptz,
  p_budget_per_seat numeric DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS TABLE(assignment_id uuid, user_id uuid, enrollment_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_seat_cost numeric;
  v_assignment_id uuid;
  v_enrollment_id uuid;
  v_talent_id uuid;
BEGIN
  IF NOT (is_company_admin(auth.uid(), p_company_id) OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_budget_per_seat IS NULL THEN
    SELECT credit_cost INTO v_seat_cost FROM content WHERE id = p_content_id;
    v_seat_cost := COALESCE(v_seat_cost, 0);
  ELSE
    v_seat_cost := p_budget_per_seat;
  END IF;

  FOREACH v_uid IN ARRAY p_user_ids LOOP
    SELECT id INTO v_talent_id FROM talents WHERE user_id = v_uid LIMIT 1;

    -- find or create enrollment
    SELECT id INTO v_enrollment_id FROM enrollments
      WHERE student_id = v_uid AND content_id = p_content_id LIMIT 1;
    IF v_enrollment_id IS NULL THEN
      INSERT INTO enrollments (student_id, talent_id, content_id, status)
        VALUES (v_uid, v_talent_id, p_content_id, 'active')
        RETURNING id INTO v_enrollment_id;
    END IF;

    INSERT INTO company_course_assignments
      (company_id, content_id, cohort_id, assigned_to, talent_id, due_at, sponsorship_mode,
       credit_cost, budget_credits, enrollment_id, status, created_by, note)
      VALUES (p_company_id, p_content_id, p_cohort_id, v_uid, v_talent_id, p_due_at, 'sponsored',
       v_seat_cost, v_seat_cost, v_enrollment_id, 'active', auth.uid(), p_note)
      RETURNING id INTO v_assignment_id;

    UPDATE enrollments SET assignment_id = v_assignment_id, sponsor_company_id = p_company_id
      WHERE id = v_enrollment_id;

    -- enroll into cohort if provided
    IF p_cohort_id IS NOT NULL THEN
      INSERT INTO cohort_enrollments (cohort_id, enrollment_id, user_id)
        VALUES (p_cohort_id, v_enrollment_id, v_uid)
        ON CONFLICT DO NOTHING;
    END IF;

    assignment_id := v_assignment_id;
    user_id := v_uid;
    enrollment_id := v_enrollment_id;
    RETURN NEXT;
  END LOOP;
END $$;

-- 7. RPC: org_learning_health
CREATE OR REPLACE FUNCTION public.org_learning_health(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT (is_company_member(auth.uid(), p_company_id) OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'active', count(*) FILTER (WHERE status = 'active'),
    'completed', count(*) FILTER (WHERE status = 'completed'),
    'overdue', count(*) FILTER (WHERE status = 'overdue'),
    'invited', count(*) FILTER (WHERE status = 'invited'),
    'total', count(*),
    'on_track_pct', CASE WHEN count(*) FILTER (WHERE status IN ('active','completed','overdue')) = 0 THEN 100
                       ELSE round(100.0 * count(*) FILTER (WHERE status IN ('active','completed'))
                            / NULLIF(count(*) FILTER (WHERE status IN ('active','completed','overdue')),0), 1)
                   END,
    'credits_burned_mtd', COALESCE((
      SELECT sum(-amount) FROM company_credit_transactions
      WHERE company_id = p_company_id
        AND service_type = 'learning_assignment'
        AND amount < 0
        AND created_at >= date_trunc('month', now())
    ), 0),
    'wallet_balance', COALESCE((SELECT balance FROM company_credits WHERE company_id = p_company_id), 0)
  ) INTO v
  FROM company_course_assignments WHERE company_id = p_company_id;

  RETURN v;
END $$;

-- 8. RPC: org_team_mastery — per-talent rollup using talent_skill_profile if present
CREATE OR REPLACE FUNCTION public.org_team_mastery(
  p_company_id uuid,
  p_content_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT (is_company_member(auth.uid(), p_company_id) OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'user_id', a.assigned_to,
    'talent_id', a.talent_id,
    'content_id', a.content_id,
    'status', a.status,
    'due_at', a.due_at,
    'completed_at', a.completed_at,
    'progress', e.progress
  ))
  INTO v
  FROM company_course_assignments a
  LEFT JOIN enrollments e ON e.id = a.enrollment_id
  WHERE a.company_id = p_company_id
    AND (p_content_id IS NULL OR a.content_id = p_content_id);

  RETURN COALESCE(v, '[]'::jsonb);
END $$;

-- 9. RPC: org_mark_overdue (called by cron)
CREATE OR REPLACE FUNCTION public.org_mark_overdue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  WITH upd AS (
    UPDATE company_course_assignments
      SET status = 'overdue', overdue_at = now(), updated_at = now()
    WHERE status = 'active' AND due_at IS NOT NULL AND due_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END $$;

-- 10. RLS for company_course_assignments (in case missing)
ALTER TABLE public.company_course_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members read assignments" ON public.company_course_assignments;
CREATE POLICY "Company members read assignments" ON public.company_course_assignments
  FOR SELECT USING (
    is_company_member(auth.uid(), company_id)
    OR has_any_admin_role(auth.uid())
    OR auth.uid() = assigned_to
  );

DROP POLICY IF EXISTS "Company admins manage assignments" ON public.company_course_assignments;
CREATE POLICY "Company admins manage assignments" ON public.company_course_assignments
  FOR ALL USING (is_company_admin(auth.uid(), company_id) OR has_any_admin_role(auth.uid()))
  WITH CHECK (is_company_admin(auth.uid(), company_id) OR has_any_admin_role(auth.uid()));
