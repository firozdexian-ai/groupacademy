
-- 1. Give the admin a content_lead role with scope NULL (= sees all schools)
--    so they can preview the talent-side Content Studio.
INSERT INTO public.user_roles (user_id, role, scope_school_id)
VALUES ('a424e9a4-ab80-4bca-95ae-e13ee2373f6b', 'content_lead', NULL)
ON CONFLICT DO NOTHING;

-- 2. content_lead_applications: regular talents apply to become content leads.
CREATE TABLE IF NOT EXISTS public.content_lead_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  motivation text NOT NULL,
  school_preference uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cla_status ON public.content_lead_applications(status);
CREATE INDEX IF NOT EXISTS idx_cla_user ON public.content_lead_applications(user_id);
ALTER TABLE public.content_lead_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talent inserts own application" ON public.content_lead_applications;
CREATE POLICY "Talent inserts own application"
  ON public.content_lead_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Talent reads own application" ON public.content_lead_applications;
CREATE POLICY "Talent reads own application"
  ON public.content_lead_applications FOR SELECT
  USING (user_id = auth.uid() OR public.has_any_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admins manage applications" ON public.content_lead_applications;
CREATE POLICY "Admins manage applications"
  ON public.content_lead_applications FOR UPDATE
  USING (public.has_any_admin_role(auth.uid()));

-- 3. Quality scoring on content_gigs
ALTER TABLE public.content_gigs
  ADD COLUMN IF NOT EXISTS quality_score smallint;

-- Replace approve_content_gig with quality-aware version (preserves old signature default).
CREATE OR REPLACE FUNCTION public.approve_content_gig(
  p_gig_id uuid,
  p_admin_notes text DEFAULT NULL,
  p_quality_score smallint DEFAULT 3
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gig RECORD;
  v_balance numeric; v_earned numeric; v_new_balance numeric;
  v_multiplier numeric;
  v_payout numeric;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_gig FROM public.content_gigs WHERE id = p_gig_id FOR UPDATE;
  IF v_gig IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gig not found');
  END IF;
  IF v_gig.status NOT IN ('submitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gig is not in submitted state');
  END IF;

  v_multiplier := CASE COALESCE(p_quality_score, 3)
    WHEN 1 THEN 0.6
    WHEN 2 THEN 0.8
    WHEN 3 THEN 1.0
    WHEN 4 THEN 1.1
    WHEN 5 THEN 1.25
    ELSE 1.0
  END;
  v_payout := round(v_gig.credit_reward * v_multiplier, 1);

  INSERT INTO public.module_resources (
    module_id, resource_type, title, description, resource_url, resource_data,
    stage_number, is_required, display_order
  ) VALUES (
    v_gig.module_id, v_gig.resource_type::resource_type, v_gig.title, v_gig.brief,
    v_gig.submitted_url, v_gig.submitted_data, v_gig.stage_number, true,
    COALESCE((SELECT MAX(display_order)+1 FROM public.module_resources WHERE module_id = v_gig.module_id), 0)
  );

  IF v_gig.claimed_by IS NOT NULL THEN
    SELECT balance, earned_balance INTO v_balance, v_earned
    FROM public.talent_credits WHERE talent_id = v_gig.claimed_by FOR UPDATE;
    IF v_balance IS NULL THEN
      v_balance := 0; v_earned := 0;
      INSERT INTO public.talent_credits (talent_id, balance, earned_balance)
      VALUES (v_gig.claimed_by, 0, 0);
    END IF;
    v_new_balance := v_balance + v_payout;
    UPDATE public.talent_credits
      SET balance = v_new_balance,
          earned_balance = COALESCE(v_earned,0) + v_payout
      WHERE talent_id = v_gig.claimed_by;
    INSERT INTO public.credit_transactions (
      talent_id, amount, balance_after, transaction_type, service_type,
      reference_id, description, is_earned
    ) VALUES (
      v_gig.claimed_by, v_payout, v_new_balance, 'gig_reward', 'content_gig',
      p_gig_id, 'Content gig approved (quality '||p_quality_score||'): ' || v_gig.title, true
    );
  END IF;

  UPDATE public.content_gigs
    SET status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        review_notes = COALESCE(p_admin_notes, review_notes),
        quality_score = p_quality_score
    WHERE id = p_gig_id;

  RETURN jsonb_build_object('success', true, 'credits_awarded', v_payout, 'quality_score', p_quality_score);
END;
$$;

-- 4. Stale claim auto-release (callable; we'll trigger it on admin board load too).
CREATE OR REPLACE FUNCTION public.release_stale_content_gigs(p_days int DEFAULT 7)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.content_gigs
    SET status = 'open', claimed_by = NULL, claimed_at = NULL
    WHERE status = 'claimed'
      AND claimed_at IS NOT NULL
      AND claimed_at < now() - (p_days || ' days')::interval;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 5. Bulk gig generators wrapping the existing per-course function.
CREATE OR REPLACE FUNCTION public.generate_content_gigs_for_school(_school_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c RECORD; v_total int := 0; v_made int;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  FOR c IN
    SELECT id FROM public.content
    WHERE school_id = _school_id AND COALESCE(is_ready, false) = false
  LOOP
    SELECT public.generate_content_gigs_for_course(c.id) INTO v_made;
    v_total := v_total + COALESCE(v_made, 0);
  END LOOP;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_content_gigs_for_all_unready()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c RECORD; v_total int := 0; v_made int;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  FOR c IN
    SELECT id FROM public.content WHERE COALESCE(is_ready, false) = false
  LOOP
    SELECT public.generate_content_gigs_for_course(c.id) INTO v_made;
    v_total := v_total + COALESCE(v_made, 0);
  END LOOP;
  RETURN v_total;
END;
$$;
