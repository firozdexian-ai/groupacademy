-- Part B foundation: autonomous gig approval & disbursement

ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS auto_approval_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS auto_approval_config jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.gig_submissions
  ADD COLUMN IF NOT EXISTS ai_score numeric(4,2),
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS auto_decision text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Seed auto-approval modes for existing platform tasks
UPDATE public.gigs SET auto_approval_mode = 'link_check',
  auto_approval_config = jsonb_build_object('min_clicks', 1)
  WHERE category IN ('job_sharing','course_resell');

UPDATE public.gigs SET auto_approval_mode = 'ai_score',
  auto_approval_config = jsonb_build_object('approve_at', 6, 'reject_under', 3, 'multiplier_floor', 0.5, 'multiplier_ceiling', 1.25)
  WHERE category = 'content_creation';

UPDATE public.gigs SET auto_approval_mode = 'ai_score',
  auto_approval_config = jsonb_build_object('approve_at', 6, 'reject_under', 3)
  WHERE category = 'job_posting';

UPDATE public.gigs SET auto_approval_mode = 'manual'
  WHERE category = 'cv_upload';

-- Finalizer RPC used by the auto-review edge function
CREATE OR REPLACE FUNCTION public.auto_finalize_gig_submission(
  p_submission_id uuid,
  p_decision text,           -- 'approved' | 'rejected' | 'escalated'
  p_score numeric DEFAULT NULL,
  p_feedback text DEFAULT NULL,
  p_credit_amount numeric DEFAULT NULL  -- if NULL & approved, uses gig.credit_reward
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission RECORD;
  v_gig RECORD;
  v_award numeric(12,1);
  v_current_balance numeric(12,1);
  v_current_earned numeric(12,1);
  v_new_balance numeric(12,1);
  v_new_earned numeric(12,1);
BEGIN
  IF p_decision NOT IN ('approved','rejected','escalated') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid decision');
  END IF;

  SELECT * INTO v_submission FROM gig_submissions WHERE id = p_submission_id FOR UPDATE;
  IF v_submission IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'submission not found');
  END IF;
  IF v_submission.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already processed');
  END IF;

  SELECT * INTO v_gig FROM gigs WHERE id = v_submission.gig_id;

  IF p_decision = 'approved' THEN
    v_award := COALESCE(p_credit_amount, v_gig.credit_reward)::numeric(12,1);

    SELECT balance, earned_balance INTO v_current_balance, v_current_earned
      FROM talent_credits WHERE talent_id = v_submission.talent_id FOR UPDATE;

    IF v_current_balance IS NULL THEN
      INSERT INTO talent_credits (talent_id, balance, earned_balance)
      VALUES (v_submission.talent_id, 0, 0);
      v_current_balance := 0; v_current_earned := 0;
    END IF;

    v_new_balance := v_current_balance + v_award;
    v_new_earned  := v_current_earned + v_award;

    UPDATE talent_credits
      SET balance = v_new_balance, earned_balance = v_new_earned
      WHERE talent_id = v_submission.talent_id;

    INSERT INTO credit_transactions
      (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
    VALUES
      (v_submission.talent_id, v_award, v_new_balance, 'gig_reward', v_gig.category, p_submission_id,
       'Auto-approved gig: ' || v_gig.title, true);

    UPDATE gigs SET total_completed = total_completed + 1 WHERE id = v_gig.id;

    UPDATE gig_submissions
      SET status = 'approved',
          credits_awarded = v_award::int,
          ai_score = p_score,
          ai_feedback = p_feedback,
          auto_decision = 'approved',
          processed_at = now(),
          reviewed_at = now()
      WHERE id = p_submission_id;

  ELSIF p_decision = 'rejected' THEN
    UPDATE gig_submissions
      SET status = 'rejected',
          ai_score = p_score,
          ai_feedback = p_feedback,
          admin_notes = COALESCE(p_feedback, 'Auto-rejected'),
          auto_decision = 'rejected',
          processed_at = now(),
          reviewed_at = now()
      WHERE id = p_submission_id;

  ELSE -- escalated
    UPDATE gig_submissions
      SET ai_score = p_score,
          ai_feedback = p_feedback,
          auto_decision = 'escalated',
          processed_at = now()
      WHERE id = p_submission_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'decision', p_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.auto_finalize_gig_submission(uuid, text, numeric, text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.auto_finalize_gig_submission(uuid, text, numeric, text, numeric) TO service_role;