
-- Create gigs table (admin-created tasks for talents to complete)
CREATE TABLE public.gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL, -- cv_upload, job_posting, job_sharing, content_creation, course_resell
  credit_reward integer NOT NULL DEFAULT 10,
  icon text DEFAULT 'gift',
  is_active boolean DEFAULT true,
  max_completions_per_user integer DEFAULT 10,
  total_budget integer, -- optional cap
  total_completed integer DEFAULT 0,
  requirements text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gig_submissions table (user work submissions)
CREATE TABLE public.gig_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  submission_data jsonb DEFAULT '{}',
  admin_notes text,
  credits_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Add earned_balance to talent_credits
ALTER TABLE public.talent_credits ADD COLUMN IF NOT EXISTS earned_balance integer NOT NULL DEFAULT 0;

-- Add is_earned to credit_transactions
ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS is_earned boolean NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_submissions ENABLE ROW LEVEL SECURITY;

-- Gigs RLS: anyone authenticated can read active gigs, admins can manage
CREATE POLICY "Anyone can read active gigs"
  ON public.gigs FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage gigs"
  ON public.gigs FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Gig submissions RLS: users can create/read own, admins can manage all
CREATE POLICY "Users can read own submissions"
  ON public.gig_submissions FOR SELECT
  TO authenticated
  USING (
    talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "Users can create own submissions"
  ON public.gig_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update submissions"
  ON public.gig_submissions FOR UPDATE
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can delete submissions"
  ON public.gig_submissions FOR DELETE
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

-- Trigger for updated_at on gigs
CREATE TRIGGER update_gigs_updated_at
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: award_gig_credits (admin approves a submission)
CREATE OR REPLACE FUNCTION public.award_gig_credits(
  p_submission_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_submission RECORD;
  v_gig RECORD;
  v_current_balance integer;
  v_new_balance integer;
  v_current_earned integer;
  v_new_earned integer;
BEGIN
  -- Only admins can call this
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get submission
  SELECT * INTO v_submission FROM gig_submissions WHERE id = p_submission_id;
  IF v_submission IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission not found');
  END IF;
  IF v_submission.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission already processed');
  END IF;

  -- Get gig
  SELECT * INTO v_gig FROM gigs WHERE id = v_submission.gig_id;

  -- Get or create credit balance
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

  -- Update balances
  UPDATE talent_credits
  SET balance = v_new_balance, earned_balance = v_new_earned
  WHERE talent_id = v_submission.talent_id;

  -- Record transaction
  INSERT INTO credit_transactions (talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, is_earned)
  VALUES (v_submission.talent_id, v_gig.credit_reward, v_new_balance, 'gig_reward', v_gig.category, p_submission_id::text, 'Gig: ' || v_gig.title, true);

  -- Update submission
  UPDATE gig_submissions
  SET status = 'approved', credits_awarded = v_gig.credit_reward, admin_notes = p_admin_notes, reviewed_at = now()
  WHERE id = p_submission_id;

  -- Increment gig counter
  UPDATE gigs SET total_completed = total_completed + 1 WHERE id = v_gig.id;

  RETURN jsonb_build_object('success', true, 'credits_awarded', v_gig.credit_reward, 'new_balance', v_new_balance);
END;
$$;

-- RPC: reject_gig_submission
CREATE OR REPLACE FUNCTION public.reject_gig_submission(
  p_submission_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE gig_submissions
  SET status = 'rejected', admin_notes = p_admin_notes, reviewed_at = now()
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission not found or already processed');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
