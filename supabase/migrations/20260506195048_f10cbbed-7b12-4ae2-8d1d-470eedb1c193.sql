
-- Phase 4.1 — Instructor Workspace & Authoring v2 (closed-loop recruitment)

-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instructor';

-- 2. Extend jobs to support instructor recruitment
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_kind text NOT NULL DEFAULT 'employer',
  ADD COLUMN IF NOT EXISTS course_brief_id uuid;

CREATE INDEX IF NOT EXISTS idx_jobs_job_kind ON public.jobs(job_kind);
CREATE INDEX IF NOT EXISTS idx_jobs_course_brief ON public.jobs(course_brief_id);

-- 3. Course briefs
CREATE TABLE IF NOT EXISTS public.course_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  syllabus jsonb NOT NULL DEFAULT '[]'::jsonb,
  mode text NOT NULL DEFAULT 'recorded' CHECK (mode IN ('recorded','live_cohort','hybrid')),
  language text NOT NULL DEFAULT 'en',
  duration_weeks integer,
  target_launch date,
  budget_amount numeric(12,2) DEFAULT 0,
  budget_currency text NOT NULL DEFAULT 'BDT',
  revenue_share_pct numeric(5,2) NOT NULL DEFAULT 60.00,
  required_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','filled','archived','closed')),
  content_id uuid REFERENCES public.content(id) ON DELETE SET NULL,
  instructor_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  instructor_user_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_course_brief_fk
  FOREIGN KEY (course_brief_id) REFERENCES public.course_briefs(id) ON DELETE SET NULL
  NOT VALID;

ALTER TABLE public.course_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage briefs" ON public.course_briefs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'content_lead'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'content_lead'::public.app_role));

CREATE POLICY "Open briefs visible to all auth" ON public.course_briefs
  FOR SELECT TO authenticated
  USING (status = 'open');

CREATE INDEX IF NOT EXISTS idx_course_briefs_status ON public.course_briefs(status);
CREATE INDEX IF NOT EXISTS idx_course_briefs_content ON public.course_briefs(content_id);

-- 4. Course engagements (active instructor contracts per course)
CREATE TABLE IF NOT EXISTS public.course_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  brief_id uuid REFERENCES public.course_briefs(id) ON DELETE SET NULL,
  hired_via_application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL,
  hired_via_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','co','assistant')),
  revenue_share_pct numeric(5,2) NOT NULL DEFAULT 60.00,
  ai_credit_cap numeric(12,1) NOT NULL DEFAULT 1000.0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, user_id, role)
);

ALTER TABLE public.course_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage engagements" ON public.course_engagements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Instructor sees own engagements" ON public.course_engagements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_course_engagements_user ON public.course_engagements(user_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_course_engagements_content ON public.course_engagements(content_id);

-- 5. Helper: is_course_instructor
CREATE OR REPLACE FUNCTION public.is_course_instructor(_content_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_engagements
    WHERE content_id = _content_id AND user_id = _user_id AND status='active'
  )
$$;

-- 6. Course revenue splits
CREATE TABLE IF NOT EXISTS public.course_revenue_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  instructor_user_id uuid NOT NULL,
  engagement_id uuid REFERENCES public.course_engagements(id) ON DELETE SET NULL,
  source_table text NOT NULL,
  source_id uuid,
  currency text NOT NULL DEFAULT 'BDT',
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  fees_amount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  instructor_amount numeric(14,2) NOT NULL DEFAULT 0,
  platform_amount numeric(14,2) NOT NULL DEFAULT 0,
  share_pct numeric(5,2) NOT NULL DEFAULT 60.00,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','available','paid','reversed')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_revenue_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor sees own splits" ON public.course_revenue_splits
  FOR SELECT TO authenticated USING (instructor_user_id = auth.uid());

CREATE POLICY "Admins manage splits" ON public.course_revenue_splits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_revenue_splits_instructor ON public.course_revenue_splits(instructor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_revenue_splits_content ON public.course_revenue_splits(content_id);

-- 7. Instructor AI credits
CREATE TABLE IF NOT EXISTS public.instructor_credit_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE,
  balance numeric(12,1) NOT NULL DEFAULT 0,
  monthly_grant numeric(12,1) NOT NULL DEFAULT 30.0,
  last_grant_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

ALTER TABLE public.instructor_credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor sees own credits" ON public.instructor_credit_balances
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins view all credits" ON public.instructor_credit_balances
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.instructor_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE,
  delta numeric(12,1) NOT NULL,
  reason text NOT NULL,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor sees own ledger" ON public.instructor_credit_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins view full ledger" ON public.instructor_credit_ledger
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_content ON public.instructor_credit_ledger(user_id, content_id, created_at DESC);

-- 8. Course publishing review state on content
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS author_status text NOT NULL DEFAULT 'draft'
    CHECK (author_status IN ('draft','submitted','in_review','approved','published','changes_requested','archived')),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- 9. Trigger: on offer accepted for an instructor job, create engagement + grant role + seed credits
CREATE OR REPLACE FUNCTION public.fn_offer_accepted_to_instructor()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_brief public.course_briefs;
  v_app  public.job_applications;
  v_job  public.jobs;
  v_content_id uuid;
  v_engagement_id uuid;
BEGIN
  IF NEW.status <> 'accepted' OR (OLD IS NOT NULL AND OLD.status = 'accepted') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_app FROM public.job_applications WHERE id = NEW.application_id;
  IF v_app.id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_app.job_id;
  IF v_job.id IS NULL OR v_job.job_kind <> 'instructor' THEN RETURN NEW; END IF;

  SELECT * INTO v_brief FROM public.course_briefs WHERE id = v_job.course_brief_id;
  IF v_brief.id IS NULL THEN RETURN NEW; END IF;

  v_content_id := v_brief.content_id;

  -- Create engagement (idempotent via unique)
  INSERT INTO public.course_engagements (
    content_id, user_id, brief_id, hired_via_application_id, hired_via_offer_id,
    revenue_share_pct, role, status
  ) VALUES (
    v_content_id, NEW.talent_id, v_brief.id, v_app.id, NEW.id,
    COALESCE(v_brief.revenue_share_pct, 60.00), 'primary', 'active'
  )
  ON CONFLICT (content_id, user_id, role) DO UPDATE
    SET status='active', updated_at=now()
  RETURNING id INTO v_engagement_id;

  -- Grant instructor role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.talent_id, 'instructor'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- Seed credit balance + ledger
  IF v_content_id IS NOT NULL THEN
    INSERT INTO public.instructor_credit_balances (user_id, content_id, balance, monthly_grant, last_grant_at)
    VALUES (NEW.talent_id, v_content_id, 50.0, 30.0, now())
    ON CONFLICT (user_id, content_id) DO NOTHING;

    INSERT INTO public.instructor_credit_ledger (user_id, content_id, delta, reason, ref_id)
    VALUES (NEW.talent_id, v_content_id, 50.0, 'seed_grant_on_hire', v_engagement_id);
  END IF;

  -- Mark brief filled
  UPDATE public.course_briefs
    SET status='filled', instructor_user_id = NEW.talent_id, updated_at=now()
    WHERE id = v_brief.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offer_accepted_instructor ON public.offers;
CREATE TRIGGER trg_offer_accepted_instructor
  AFTER INSERT OR UPDATE OF status ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.fn_offer_accepted_to_instructor();

-- 10. RPC: debit instructor credits atomically
CREATE OR REPLACE FUNCTION public.debit_instructor_credit(
  _user_id uuid,
  _content_id uuid,
  _amount numeric,
  _reason text,
  _ref_id uuid DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance numeric(12,1);
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;

  SELECT balance INTO v_balance
    FROM public.instructor_credit_balances
    WHERE user_id = _user_id AND content_id = _content_id
    FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'no credit balance for this course';
  END IF;
  IF v_balance < _amount THEN
    RAISE EXCEPTION 'insufficient instructor credits';
  END IF;

  UPDATE public.instructor_credit_balances
    SET balance = balance - _amount, updated_at = now()
    WHERE user_id = _user_id AND content_id = _content_id;

  INSERT INTO public.instructor_credit_ledger (user_id, content_id, delta, reason, ref_id)
    VALUES (_user_id, _content_id, -_amount, _reason, _ref_id);

  RETURN v_balance - _amount;
END;
$$;

-- 11. RPC: get instructor dashboard summary
CREATE OR REPLACE FUNCTION public.get_instructor_summary(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'engagements', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'content_id', e.content_id,
        'title', c.title,
        'slug', c.slug,
        'role', e.role,
        'status', e.status,
        'revenue_share_pct', e.revenue_share_pct,
        'author_status', c.author_status
      )) FROM public.course_engagements e
      LEFT JOIN public.content c ON c.id = e.content_id
      WHERE e.user_id = _user_id AND e.status='active'
    ), '[]'::jsonb),
    'credits', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'content_id', content_id,
        'balance', balance,
        'monthly_grant', monthly_grant
      )) FROM public.instructor_credit_balances
      WHERE user_id = _user_id
    ), '[]'::jsonb),
    'earnings_total', COALESCE((
      SELECT SUM(instructor_amount) FROM public.course_revenue_splits
      WHERE instructor_user_id = _user_id AND status IN ('available','paid')
    ), 0),
    'earnings_pending', COALESCE((
      SELECT SUM(instructor_amount) FROM public.course_revenue_splits
      WHERE instructor_user_id = _user_id AND status = 'pending'
    ), 0)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- 12. Updated_at trigger reuse
CREATE TRIGGER trg_course_briefs_updated_at
  BEFORE UPDATE ON public.course_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_course_engagements_updated_at
  BEFORE UPDATE ON public.course_engagements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
