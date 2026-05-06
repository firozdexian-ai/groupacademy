
-- Apply for reviewer (creates pending profile + records calibration request)
CREATE OR REPLACE FUNCTION public.apply_for_reviewer(_categories text[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid; v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  INSERT INTO public.reviewer_profiles(talent_id, categories, status, tier)
  VALUES (v_uid, COALESCE(_categories,'{}'), 'paused', 'apprentice')
  ON CONFLICT (talent_id) DO UPDATE SET categories = EXCLUDED.categories, updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Submit calibration attempt
CREATE OR REPLACE FUNCTION public.submit_calibration_attempt(_score numeric, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid; v_pass boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  v_pass := COALESCE(_score,0) >= 75;

  INSERT INTO public.reviewer_calibration_attempts(talent_id, score, passed, answers)
  VALUES (v_uid, _score, v_pass, COALESCE(_answers,'{}'::jsonb));

  IF v_pass THEN
    UPDATE public.reviewer_profiles
    SET status='active', tier='apprentice', updated_at=now()
    WHERE talent_id = v_uid;

    INSERT INTO public.reviewer_reputation_events(talent_id, event, weight, metadata)
    VALUES (v_uid, 'calibration_passed', 1, jsonb_build_object('score', _score));
  ELSE
    INSERT INTO public.reviewer_reputation_events(talent_id, event, weight, metadata)
    VALUES (v_uid, 'calibration_failed', 0, jsonb_build_object('score', _score));
  END IF;

  RETURN jsonb_build_object('passed', v_pass, 'score', _score);
END;
$$;

-- Atomic claim
CREATE OR REPLACE FUNCTION public.claim_review_assignment(_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid; v_row public.gig_review_assignments%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  UPDATE public.gig_review_assignments
  SET status='claimed', claimed_at=now(), updated_at=now()
  WHERE id = _assignment_id
    AND reviewer_id = v_uid
    AND status='offered'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_available');
  END IF;

  RETURN jsonb_build_object('ok', true, 'assignment_id', v_row.id, 'due_at', v_row.due_at);
END;
$$;

-- Settle panel: aggregate verdicts; majority wins
CREATE OR REPLACE FUNCTION public.settle_review_panel(_kind text, _source_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int; v_submitted int; v_verdicts jsonb;
  v_top_verdict text; v_top_count int;
BEGIN
  SELECT COUNT(*) FILTER (WHERE status IN ('offered','claimed','submitted')),
         COUNT(*) FILTER (WHERE status='submitted')
    INTO v_total, v_submitted
  FROM public.gig_review_assignments
  WHERE kind = _kind AND source_id = _source_id;

  IF v_submitted < 3 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_verdicts', 'submitted', v_submitted);
  END IF;

  SELECT verdict, COUNT(*) AS c INTO v_top_verdict, v_top_count
  FROM public.gig_review_assignments
  WHERE kind=_kind AND source_id=_source_id AND status='submitted'
  GROUP BY verdict
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Tie detection: if any other verdict has same count, escalate to admin
  IF EXISTS (
    SELECT 1 FROM public.gig_review_assignments
    WHERE kind=_kind AND source_id=_source_id AND status='submitted' AND verdict <> v_top_verdict
    GROUP BY verdict HAVING COUNT(*) >= v_top_count
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tie', 'top', v_top_verdict);
  END IF;

  -- Apply: write reputation events + settle source
  IF _kind = 'escalation' THEN
    UPDATE public.gig_verifications
    SET verdict = CASE WHEN v_top_verdict IN ('approve','auto_approved') THEN 'human_approved'
                       WHEN v_top_verdict IN ('reject','human_rejected') THEN 'human_rejected'
                       ELSE 'auto_revise' END,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = _source_id;
  ELSIF _kind = 'dispute' THEN
    UPDATE public.gig_disputes
    SET status='resolved', final_verdict=v_top_verdict, resolved_at=now(), updated_at=now()
    WHERE id = _source_id;
  END IF;

  -- Award reputation: correct = matches majority, incorrect = doesn't
  INSERT INTO public.reviewer_reputation_events(talent_id, event, weight, assignment_id)
  SELECT reviewer_id,
         CASE WHEN verdict = v_top_verdict THEN 'assignment_correct' ELSE 'assignment_incorrect' END,
         CASE WHEN verdict = v_top_verdict THEN 1 ELSE -1 END,
         id
  FROM public.gig_review_assignments
  WHERE kind=_kind AND source_id=_source_id AND status='submitted';

  -- Increment items_resolved
  UPDATE public.reviewer_profiles
  SET items_resolved = items_resolved + 1, last_active_at = now()
  WHERE talent_id IN (
    SELECT reviewer_id FROM public.gig_review_assignments
    WHERE kind=_kind AND source_id=_source_id AND status='submitted'
  );

  -- Pay reviewers via ledger (flat by tier; fixed per-source schedule)
  INSERT INTO public.reviewer_credit_ledger(talent_id, assignment_id, delta, reason)
  SELECT a.reviewer_id, a.id,
         CASE rp.tier WHEN 'master' THEN 40.0 WHEN 'senior' THEN 20.0 WHEN 'reviewer' THEN 10.0 ELSE 5.0 END,
         'review_settled'
  FROM public.gig_review_assignments a
  LEFT JOIN public.reviewer_profiles rp ON rp.talent_id = a.reviewer_id
  WHERE a.kind=_kind AND a.source_id=_source_id AND a.status='submitted';

  RETURN jsonb_build_object('ok', true, 'verdict', v_top_verdict);
END;
$$;

-- Submit verdict (calls settle when 3+ are in)
CREATE OR REPLACE FUNCTION public.submit_review_verdict(
  _assignment_id uuid, _verdict text, _payload jsonb DEFAULT '{}'::jsonb,
  _confidence numeric DEFAULT 0.7, _rationale text DEFAULT NULL, _time_spent_s int DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid; v_row public.gig_review_assignments%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  UPDATE public.gig_review_assignments
  SET verdict=_verdict, verdict_payload=COALESCE(_payload,'{}'::jsonb),
      confidence=_confidence, rationale=_rationale,
      time_spent_s=_time_spent_s, status='submitted', submitted_at=now(), updated_at=now()
  WHERE id=_assignment_id AND reviewer_id=v_uid AND status='claimed'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_claimed');
  END IF;

  -- Try settle
  PERFORM public.settle_review_panel(v_row.kind, v_row.source_id);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Open dispute (talent or poster)
CREATE OR REPLACE FUNCTION public.open_gig_dispute(
  _gig_id uuid, _submission_id uuid, _verification_id uuid,
  _opened_by_role text, _reason_code text, _narrative text, _evidence jsonb DEFAULT '[]'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid; v_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  INSERT INTO public.gig_disputes(gig_id, submission_id, verification_id, opened_by, opened_by_role,
                                  reason_code, narrative, evidence, status)
  VALUES (_gig_id, _submission_id, _verification_id, v_uid, _opened_by_role,
          _reason_code, _narrative, COALESCE(_evidence,'[]'::jsonb), 'open')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Admin override resolve dispute
CREATE OR REPLACE FUNCTION public.resolve_dispute(_dispute_id uuid, _verdict text, _notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.gig_disputes
  SET status='resolved', final_verdict=_verdict, resolution_notes=_notes,
      resolved_by=auth.uid(), resolved_at=now(), updated_at=now()
  WHERE id=_dispute_id;
END;
$$;
