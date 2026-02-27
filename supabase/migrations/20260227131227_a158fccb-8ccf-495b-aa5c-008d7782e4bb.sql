
-- Fix award_gig_credits: remove ::text cast on reference_id
CREATE OR REPLACE FUNCTION public.award_gig_credits(p_submission_id uuid, p_admin_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_submission RECORD;
  v_gig RECORD;
  v_current_balance integer;
  v_new_balance integer;
  v_current_earned integer;
  v_new_earned integer;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_submission FROM gig_submissions WHERE id = p_submission_id;
  IF v_submission IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission not found');
  END IF;
  IF v_submission.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission already processed');
  END IF;

  SELECT * INTO v_gig FROM gigs WHERE id = v_submission.gig_id;

  SELECT balance, earned_balance INTO v_current_balance, v_current_earned
  FROM talent_credits WHERE talent_id = v_submission.talent_id FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
    v_current_earned := 0;
    INSERT INTO talent_credits (talent_id, balance, earned_balance)
    VALUES (v_submission.talent_id, 0, 0);
  END IF;

  v_new_balance := v_current_balance + v_gig.credit_reward;
  v_new_earned := v_current_earned + v_gig.credit_reward;

  UPDATE talent_credits
  SET balance = v_new_balance, earned_balance = v_new_earned
  WHERE talent_id = v_submission.talent_id;

  INSERT INTO credit_transactions (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
  VALUES (v_submission.talent_id, v_gig.credit_reward, v_new_balance, 'gig_reward', v_gig.category, p_submission_id, 'Gig: ' || v_gig.title, true);

  UPDATE gig_submissions
  SET status = 'approved', credits_awarded = v_gig.credit_reward, admin_notes = p_admin_notes, reviewed_at = now()
  WHERE id = p_submission_id;

  UPDATE gigs SET total_completed = total_completed + 1 WHERE id = v_gig.id;

  RETURN jsonb_build_object('success', true, 'credits_awarded', v_gig.credit_reward, 'new_balance', v_new_balance);
END;
$function$;

-- Fix track_shared_job_click: remove ::text cast on reference_id
CREATE OR REPLACE FUNCTION public.track_shared_job_click(p_job_id uuid, p_ref_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_talent_id uuid;
  v_click_count integer;
  v_submission record;
  v_gig record;
  v_current_balance integer;
  v_current_earned integer;
  v_new_balance integer;
  v_new_earned integer;
  v_job_title text;
BEGIN
  SELECT id INTO v_talent_id FROM talents WHERE ref_code = p_ref_code;
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('tracked', false, 'reason', 'invalid_ref');
  END IF;

  INSERT INTO job_share_clicks (job_id, talent_id, ref_code)
  VALUES (p_job_id, v_talent_id, p_ref_code);

  SELECT COUNT(*) INTO v_click_count
  FROM job_share_clicks
  WHERE talent_id = v_talent_id AND job_id = p_job_id;

  IF v_click_count >= 10 THEN
    SELECT gs.* INTO v_submission
    FROM gig_submissions gs
    JOIN gigs g ON g.id = gs.gig_id
    WHERE gs.talent_id = v_talent_id
      AND gs.status = 'pending'
      AND g.category = 'job_sharing'
      AND gs.submission_data->>'job_id' = p_job_id::text
    LIMIT 1;

    IF v_submission IS NOT NULL THEN
      SELECT * INTO v_gig FROM gigs WHERE id = v_submission.gig_id;
      SELECT title INTO v_job_title FROM jobs WHERE id = p_job_id;

      SELECT balance, earned_balance INTO v_current_balance, v_current_earned
      FROM talent_credits WHERE talent_id = v_talent_id FOR UPDATE;

      IF v_current_balance IS NULL THEN
        v_current_balance := 0;
        v_current_earned := 0;
        INSERT INTO talent_credits (talent_id, balance, earned_balance)
        VALUES (v_talent_id, 0, 0);
      END IF;

      v_new_balance := v_current_balance + v_gig.credit_reward;
      v_new_earned := v_current_earned + v_gig.credit_reward;

      UPDATE talent_credits
      SET balance = v_new_balance, earned_balance = v_new_earned
      WHERE talent_id = v_talent_id;

      INSERT INTO credit_transactions (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
      VALUES (v_talent_id, v_gig.credit_reward, v_new_balance, 'gig_reward', 'job_sharing', v_submission.id, 'Auto-approved: ' || v_gig.title, true);

      UPDATE gig_submissions
      SET status = 'approved', credits_awarded = v_gig.credit_reward, admin_notes = 'Auto-approved: 10+ clicks reached', reviewed_at = now()
      WHERE id = v_submission.id;

      UPDATE gigs SET total_completed = COALESCE(total_completed, 0) + 1 WHERE id = v_gig.id;

      INSERT INTO notifications (talent_id, type, title, message, icon, link)
      VALUES (
        v_talent_id,
        'reward',
        'You earned ' || v_gig.credit_reward || ' credits! 🎉',
        'Your share link for "' || COALESCE(v_job_title, 'a job') || '" hit 10+ clicks. ' || v_gig.credit_reward || ' credits have been added to your wallet.',
        'coins',
        '/app/gigs'
      );

      RETURN jsonb_build_object('tracked', true, 'click_count', v_click_count, 'auto_approved', true, 'credits_awarded', v_gig.credit_reward);
    END IF;
  END IF;

  RETURN jsonb_build_object('tracked', true, 'click_count', v_click_count, 'auto_approved', false);
END;
$function$;
