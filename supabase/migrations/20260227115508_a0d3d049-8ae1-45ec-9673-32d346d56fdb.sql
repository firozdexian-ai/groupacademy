
CREATE OR REPLACE FUNCTION public.track_shared_job_click(p_job_id uuid, p_ref_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  -- Look up talent by ref_code
  SELECT id INTO v_talent_id FROM talents WHERE ref_code = p_ref_code;
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('tracked', false, 'reason', 'invalid_ref');
  END IF;

  -- Insert the click
  INSERT INTO job_share_clicks (job_id, talent_id, ref_code)
  VALUES (p_job_id, v_talent_id, p_ref_code);

  -- Count total clicks for this talent+job
  SELECT COUNT(*) INTO v_click_count
  FROM job_share_clicks
  WHERE talent_id = v_talent_id AND job_id = p_job_id;

  -- Check if threshold met and there's a pending submission
  IF v_click_count >= 10 THEN
    -- Find pending gig submission for job_sharing where submission_data->>'job_id' matches
    SELECT gs.* INTO v_submission
    FROM gig_submissions gs
    JOIN gigs g ON g.id = gs.gig_id
    WHERE gs.talent_id = v_talent_id
      AND gs.status = 'pending'
      AND g.category = 'job_sharing'
      AND gs.submission_data->>'job_id' = p_job_id::text
    LIMIT 1;

    IF v_submission IS NOT NULL THEN
      -- Get the gig details
      SELECT * INTO v_gig FROM gigs WHERE id = v_submission.gig_id;

      -- Get job title for notification
      SELECT title INTO v_job_title FROM jobs WHERE id = p_job_id;

      -- Get or create credit balance
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

      -- Update balances
      UPDATE talent_credits
      SET balance = v_new_balance, earned_balance = v_new_earned
      WHERE talent_id = v_talent_id;

      -- Record transaction
      INSERT INTO credit_transactions (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
      VALUES (v_talent_id, v_gig.credit_reward, v_new_balance, 'gig_reward', 'job_sharing', v_submission.id::text, 'Auto-approved: ' || v_gig.title, true);

      -- Update submission
      UPDATE gig_submissions
      SET status = 'approved', credits_awarded = v_gig.credit_reward, admin_notes = 'Auto-approved: 10+ clicks reached', reviewed_at = now()
      WHERE id = v_submission.id;

      -- Increment gig counter
      UPDATE gigs SET total_completed = COALESCE(total_completed, 0) + 1 WHERE id = v_gig.id;

      -- Send notification to the seeker
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
$$;
