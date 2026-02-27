
-- 1. Add ref_code column to talents
ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;

-- 2. Backfill existing talents with first 8 chars of their UUID
UPDATE public.talents SET ref_code = LEFT(id::text, 8) WHERE ref_code IS NULL;

-- 3. Make ref_code NOT NULL with default for new inserts
ALTER TABLE public.talents ALTER COLUMN ref_code SET DEFAULT '';

-- 4. Trigger to auto-generate ref_code on insert
CREATE OR REPLACE FUNCTION public.generate_talent_ref_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ref_code IS NULL OR NEW.ref_code = '' THEN
    NEW.ref_code := LEFT(NEW.id::text, 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_talent_ref_code
BEFORE INSERT ON public.talents
FOR EACH ROW
EXECUTE FUNCTION public.generate_talent_ref_code();

-- 5. Create job_share_clicks table
CREATE TABLE public.job_share_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  ref_code text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text
);

CREATE INDEX idx_job_share_clicks_talent_job ON public.job_share_clicks(talent_id, job_id);
CREATE INDEX idx_job_share_clicks_ref_code ON public.job_share_clicks(ref_code);

-- 6. RLS for job_share_clicks
ALTER TABLE public.job_share_clicks ENABLE ROW LEVEL SECURITY;

-- Anon/anyone can insert (tracking clicks from anonymous visitors)
CREATE POLICY "Anyone can insert job share clicks"
ON public.job_share_clicks FOR INSERT
WITH CHECK (true);

-- Authenticated users can view their own clicks
CREATE POLICY "Users can view own share clicks"
ON public.job_share_clicks FOR SELECT
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  OR public.has_any_admin_role(auth.uid())
);

-- 7. RPC: track_shared_job_click with auto-approve logic
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

      RETURN jsonb_build_object('tracked', true, 'click_count', v_click_count, 'auto_approved', true, 'credits_awarded', v_gig.credit_reward);
    END IF;
  END IF;

  RETURN jsonb_build_object('tracked', true, 'click_count', v_click_count, 'auto_approved', false);
END;
$$;
