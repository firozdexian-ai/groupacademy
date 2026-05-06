
-- =========================================================
-- Phase 5.4 — Reviewer Tier & Disputes
-- =========================================================

-- Reviewer profiles
CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'apprentice' CHECK (tier IN ('apprentice','reviewer','senior','master')),
  categories text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','suspended')),
  accuracy numeric(5,2) NOT NULL DEFAULT 0,
  items_resolved integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_status ON public.reviewer_profiles(status, tier);
ALTER TABLE public.reviewer_profiles ENABLE ROW LEVEL SECURITY;

-- Reviewer calibration attempts
CREATE TABLE IF NOT EXISTS public.reviewer_calibration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  score numeric(5,2) NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviewer_calibration_talent ON public.reviewer_calibration_attempts(talent_id, attempted_at DESC);
ALTER TABLE public.reviewer_calibration_attempts ENABLE ROW LEVEL SECURITY;

-- Gig review assignments (separate from learning review_assignments)
CREATE TABLE IF NOT EXISTS public.gig_review_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('escalation','dispute')),
  source_id uuid NOT NULL, -- verification_id or dispute_id
  gig_id uuid,
  submission_id uuid,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered','claimed','submitted','expired','recused','superseded')),
  offered_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  submitted_at timestamptz,
  due_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  verdict text,
  verdict_payload jsonb,
  confidence numeric(3,2),
  rationale text,
  time_spent_s integer,
  payout_credits numeric(12,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gig_rev_assign_reviewer ON public.gig_review_assignments(reviewer_id, status);
CREATE INDEX IF NOT EXISTS idx_gig_rev_assign_source ON public.gig_review_assignments(kind, source_id);
ALTER TABLE public.gig_review_assignments ENABLE ROW LEVEL SECURITY;

-- Gig disputes
CREATE TABLE IF NOT EXISTS public.gig_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL,
  submission_id uuid,
  verification_id uuid,
  opened_by uuid NOT NULL,
  opened_by_role text NOT NULL CHECK (opened_by_role IN ('poster','talent')),
  reason_code text NOT NULL,
  narrative text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','panel','admin','resolved','withdrawn')),
  final_verdict text,
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gig_disputes_gig ON public.gig_disputes(gig_id, status);
CREATE INDEX IF NOT EXISTS idx_gig_disputes_opened_by ON public.gig_disputes(opened_by);
ALTER TABLE public.gig_disputes ENABLE ROW LEVEL SECURITY;

-- Reviewer credit ledger
CREATE TABLE IF NOT EXISTS public.reviewer_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  assignment_id uuid REFERENCES public.gig_review_assignments(id) ON DELETE SET NULL,
  delta numeric(12,1) NOT NULL,
  reason text NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviewer_ledger_talent ON public.reviewer_credit_ledger(talent_id, created_at DESC);
ALTER TABLE public.reviewer_credit_ledger ENABLE ROW LEVEL SECURITY;

-- Reviewer reputation events
CREATE TABLE IF NOT EXISTS public.reviewer_reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  event text NOT NULL CHECK (event IN ('assignment_correct','assignment_incorrect','assignment_expired','recused','tier_promoted','tier_demoted','calibration_passed','calibration_failed','quality_check_pass','quality_check_fail')),
  weight numeric(5,2) NOT NULL DEFAULT 0,
  assignment_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviewer_rep_talent ON public.reviewer_reputation_events(talent_id, created_at DESC);
ALTER TABLE public.reviewer_reputation_events ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS policies
-- =========================================================

-- reviewer_profiles
CREATE POLICY "Reviewers see own profile" ON public.reviewer_profiles FOR SELECT TO authenticated
USING (talent_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Reviewers can apply (insert own)" ON public.reviewer_profiles FOR INSERT TO authenticated
WITH CHECK (talent_id = auth.uid());
CREATE POLICY "Reviewers update own profile non-tier" ON public.reviewer_profiles FOR UPDATE TO authenticated
USING (talent_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (talent_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete reviewer profile" ON public.reviewer_profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- reviewer_calibration_attempts
CREATE POLICY "Calibration self read" ON public.reviewer_calibration_attempts FOR SELECT TO authenticated
USING (talent_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Calibration self insert" ON public.reviewer_calibration_attempts FOR INSERT TO authenticated
WITH CHECK (talent_id = auth.uid());

-- gig_review_assignments
CREATE POLICY "Assignment reviewer read" ON public.gig_review_assignments FOR SELECT TO authenticated
USING (reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Assignment reviewer update own" ON public.gig_review_assignments FOR UPDATE TO authenticated
USING (reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (reviewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Assignment admin insert" ON public.gig_review_assignments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- gig_disputes
CREATE POLICY "Disputes party read" ON public.gig_disputes FOR SELECT TO authenticated
USING (
  opened_by = auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.gigs g WHERE g.id = gig_disputes.gig_id)
);
CREATE POLICY "Disputes opener insert" ON public.gig_disputes FOR INSERT TO authenticated
WITH CHECK (opened_by = auth.uid());
CREATE POLICY "Disputes admin update" ON public.gig_disputes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR opened_by = auth.uid())
WITH CHECK (public.has_role(auth.uid(),'admin') OR opened_by = auth.uid());

-- reviewer_credit_ledger
CREATE POLICY "Ledger self read" ON public.reviewer_credit_ledger FOR SELECT TO authenticated
USING (talent_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Ledger admin insert" ON public.reviewer_credit_ledger FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- reviewer_reputation_events
CREATE POLICY "Reputation self read" ON public.reviewer_reputation_events FOR SELECT TO authenticated
USING (talent_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Reputation admin insert" ON public.reviewer_reputation_events FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE TRIGGER trg_reviewer_profiles_uat BEFORE UPDATE ON public.reviewer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gig_review_assign_uat BEFORE UPDATE ON public.gig_review_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gig_disputes_uat BEFORE UPDATE ON public.gig_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Reputation recompute trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.recompute_reviewer_reputation(_talent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct int;
  v_total int;
  v_accuracy numeric(5,2);
  v_resolved int;
  v_new_tier text;
  v_current_tier text;
BEGIN
  SELECT COUNT(*) FILTER (WHERE event = 'assignment_correct'),
         COUNT(*) FILTER (WHERE event IN ('assignment_correct','assignment_incorrect'))
    INTO v_correct, v_total
  FROM public.reviewer_reputation_events
  WHERE talent_id = _talent_id;

  v_accuracy := CASE WHEN v_total = 0 THEN 0 ELSE round((v_correct::numeric / v_total) * 100, 2) END;

  SELECT COALESCE(items_resolved,0), tier INTO v_resolved, v_current_tier
  FROM public.reviewer_profiles WHERE talent_id = _talent_id;

  v_new_tier := v_current_tier;
  IF v_resolved >= 200 AND v_accuracy >= 92 THEN v_new_tier := 'master';
  ELSIF v_resolved >= 75 AND v_accuracy >= 88 THEN v_new_tier := 'senior';
  ELSIF v_resolved >= 20 AND v_accuracy >= 80 THEN v_new_tier := 'reviewer';
  ELSE v_new_tier := 'apprentice';
  END IF;

  UPDATE public.reviewer_profiles
  SET accuracy = v_accuracy,
      tier = v_new_tier,
      updated_at = now()
  WHERE talent_id = _talent_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_reviewer_rep_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_reviewer_reputation(NEW.talent_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviewer_rep_after_insert AFTER INSERT ON public.reviewer_reputation_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_reviewer_rep_recompute();

-- =========================================================
-- 5.1–5.3 cleanup
-- =========================================================

-- Verifier override rollup view (false-positive rate per kind)
CREATE OR REPLACE VIEW public.gig_verifier_override_rollup AS
SELECT
  v.gig_kind,
  date_trunc('day', v.created_at) AS day,
  COUNT(*) AS total_verdicts,
  COUNT(*) FILTER (WHERE v.verdict = 'auto_approved') AS auto_approved,
  COUNT(*) FILTER (WHERE v.verdict IN ('human_rejected') AND v.reviewed_by IS NOT NULL) AS overridden_rejects,
  CASE WHEN COUNT(*) FILTER (WHERE v.verdict='auto_approved') = 0 THEN 0
       ELSE round(
         (COUNT(*) FILTER (WHERE v.verdict='human_rejected' AND v.reviewed_by IS NOT NULL))::numeric
         / NULLIF(COUNT(*) FILTER (WHERE v.verdict='auto_approved'),0) * 100, 2)
  END AS false_positive_rate
FROM public.gig_verifications v
GROUP BY v.gig_kind, date_trunc('day', v.created_at);

-- Trust decay daily helper (callable by cron-trust-decay edge)
CREATE OR REPLACE FUNCTION public.recompute_all_trust_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN SELECT DISTINCT talent_id FROM public.talent_trust_events LOOP
    PERFORM public.recompute_talent_trust_score(r.talent_id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
