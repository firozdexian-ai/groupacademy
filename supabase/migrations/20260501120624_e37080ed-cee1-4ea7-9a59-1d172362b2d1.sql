-- Payout requests table for talent agent creators
CREATE TABLE public.agent_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  amount_credits NUMERIC(12,1) NOT NULL CHECK (amount_credits > 0),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank','mobile_money','wallet','other')),
  payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_payout_requests_talent ON public.agent_payout_requests(talent_id);
CREATE INDEX idx_agent_payout_requests_status ON public.agent_payout_requests(status);

ALTER TABLE public.agent_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents view their own payout requests"
ON public.agent_payout_requests FOR SELECT
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

CREATE POLICY "Talents create their own payout requests"
ON public.agent_payout_requests FOR INSERT
WITH CHECK (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  AND status = 'pending'
);

CREATE POLICY "Admins view all payout requests"
ON public.agent_payout_requests FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins update payout requests"
ON public.agent_payout_requests FOR UPDATE
USING (public.has_any_admin_role(auth.uid()));

CREATE TRIGGER update_agent_payout_requests_updated_at
BEFORE UPDATE ON public.agent_payout_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for marketplace earnings (talent visibility)
ALTER TABLE public.agent_marketplace_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talents view their agent earnings" ON public.agent_marketplace_earnings;
CREATE POLICY "Talents view their agent earnings"
ON public.agent_marketplace_earnings FOR SELECT
USING (
  builder_kind = 'talent'
  AND builder_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins view all earnings" ON public.agent_marketplace_earnings;
CREATE POLICY "Admins view all earnings"
ON public.agent_marketplace_earnings FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

-- Summary function for the calling talent
CREATE OR REPLACE FUNCTION public.talent_marketplace_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_lifetime numeric := 0;
  v_paid numeric := 0;
  v_pending numeric := 0;
BEGIN
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = auth.uid();
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('error','not_found');
  END IF;

  SELECT COALESCE(SUM(builder_share),0) INTO v_lifetime
  FROM public.agent_marketplace_earnings
  WHERE builder_kind = 'talent' AND builder_id = v_talent_id;

  SELECT COALESCE(SUM(amount_credits),0) INTO v_paid
  FROM public.agent_payout_requests
  WHERE talent_id = v_talent_id AND status = 'paid';

  SELECT COALESCE(SUM(amount_credits),0) INTO v_pending
  FROM public.agent_payout_requests
  WHERE talent_id = v_talent_id AND status IN ('pending','approved');

  RETURN jsonb_build_object(
    'lifetime_earned', v_lifetime,
    'paid_out', v_paid,
    'pending_payout', v_pending,
    'available', GREATEST(0, v_lifetime - v_paid - v_pending)
  );
END;
$$;

-- Mark payout as paid (admin)
CREATE OR REPLACE FUNCTION public.mark_payout_paid(p_request_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  UPDATE public.agent_payout_requests
    SET status='paid', processed_by=auth.uid(), processed_at=now(),
        admin_notes=COALESCE(p_notes, admin_notes)
    WHERE id=p_request_id AND status IN ('pending','approved');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not found or already processed');
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;