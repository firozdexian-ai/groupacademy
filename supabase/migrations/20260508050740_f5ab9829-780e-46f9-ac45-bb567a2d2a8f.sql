
-- 1. Unlocks table
CREATE TABLE public.talent_contact_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  unlocked_by uuid REFERENCES auth.users(id),
  credits_spent numeric(12,1) NOT NULL DEFAULT 0,
  email text,
  phone text,
  linkedin_url text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, talent_id)
);

CREATE INDEX idx_tcu_company ON public.talent_contact_unlocks(company_id);
CREATE INDEX idx_tcu_talent ON public.talent_contact_unlocks(talent_id);

ALTER TABLE public.talent_contact_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read own unlocks"
  ON public.talent_contact_unlocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = talent_contact_unlocks.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- inserts only via SECURITY DEFINER RPC; no direct insert policy.

-- 2. Pricing
INSERT INTO public.platform_settings (key, value, description)
VALUES ('talent_contact_unlock_cost', '10', 'Credits charged to a company wallet to unlock one talent contact.')
ON CONFLICT (key) DO NOTHING;

-- 3. RPCs
CREATE OR REPLACE FUNCTION public.get_talent_contact_unlock_cost()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT value::numeric FROM platform_settings WHERE key='talent_contact_unlock_cost'), 10);
$$;

CREATE OR REPLACE FUNCTION public.unlock_talent_contact(
  p_company_id uuid,
  p_talent_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cost numeric;
  v_existing public.talent_contact_unlocks%ROWTYPE;
  v_talent record;
  v_charge jsonb;
  v_new public.talent_contact_unlocks%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id AND user_id = v_user AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_company_member');
  END IF;

  -- already unlocked? return cached
  SELECT * INTO v_existing FROM talent_contact_unlocks
   WHERE company_id = p_company_id AND talent_id = p_talent_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true, 'reused', true,
      'contact', jsonb_build_object(
        'full_name', v_existing.full_name,
        'email', v_existing.email,
        'phone', v_existing.phone,
        'linkedin_url', v_existing.linkedin_url
      ),
      'credits_spent', 0
    );
  END IF;

  SELECT id, full_name, email, phone, linkedin_url
    INTO v_talent FROM talents WHERE id = p_talent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'talent_not_found');
  END IF;

  v_cost := public.get_talent_contact_unlock_cost();

  v_charge := public.charge_company_credits(
    p_company_id,
    v_cost,
    'debit',
    'talent_unlock',
    'Unlocked contact for talent ' || COALESCE(v_talent.full_name, p_talent_id::text),
    p_talent_id
  );

  IF NOT COALESCE((v_charge->>'ok')::boolean, false) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', COALESCE(v_charge->>'error', 'insufficient_credits'),
      'cost', v_cost
    );
  END IF;

  INSERT INTO talent_contact_unlocks
    (company_id, talent_id, unlocked_by, credits_spent, email, phone, linkedin_url, full_name)
  VALUES
    (p_company_id, p_talent_id, v_user, v_cost,
     v_talent.email, v_talent.phone, v_talent.linkedin_url, v_talent.full_name)
  RETURNING * INTO v_new;

  RETURN jsonb_build_object(
    'ok', true, 'reused', false,
    'contact', jsonb_build_object(
      'full_name', v_new.full_name,
      'email', v_new.email,
      'phone', v_new.phone,
      'linkedin_url', v_new.linkedin_url
    ),
    'credits_spent', v_cost
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_company_unlocked_talents(p_company_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT talent_id FROM talent_contact_unlocks
   WHERE company_id = p_company_id
     AND (
       EXISTS (
         SELECT 1 FROM company_members
         WHERE company_id = p_company_id AND user_id = auth.uid() AND status = 'active'
       ) OR has_role(auth.uid(), 'admin')
     );
$$;

-- 4. Manual payment requests — allow company top-ups
ALTER TABLE public.manual_payment_requests
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requester_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.manual_payment_requests ALTER COLUMN talent_id DROP NOT NULL;

DROP POLICY IF EXISTS "Authenticated users can submit own payment request" ON public.manual_payment_requests;
CREATE POLICY "Authenticated users can submit own payment request"
  ON public.manual_payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    AND (
      (talent_id IS NOT NULL AND EXISTS (SELECT 1 FROM talents WHERE id = talent_id AND user_id = auth.uid()))
      OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM company_members WHERE company_id = manual_payment_requests.company_id
              AND user_id = auth.uid() AND status = 'active'))
    )
  );

DROP POLICY IF EXISTS "Requesters read own payment request" ON public.manual_payment_requests;
CREATE POLICY "Requesters read own payment request"
  ON public.manual_payment_requests FOR SELECT
  TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
