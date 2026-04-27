
-- ===== credit_invoices table =====
CREATE TABLE public.credit_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  bundle_credits integer NOT NULL CHECK (bundle_credits > 0),
  bundle_price_usd numeric(10,2) NOT NULL CHECK (bundle_price_usd >= 0),
  bundle_price_local numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  channel text NOT NULL DEFAULT 'whatsapp',
  whatsapp_message_sent boolean NOT NULL DEFAULT false,
  payment_method text,
  payment_reference text,
  payment_proof_url text,
  admin_notes text,
  cancellation_reason text,
  credits_disbursed boolean NOT NULL DEFAULT false,
  credit_transaction_id uuid REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_invoices_talent ON public.credit_invoices(talent_id);
CREATE INDEX idx_credit_invoices_status ON public.credit_invoices(status);
CREATE INDEX idx_credit_invoices_created_at ON public.credit_invoices(created_at DESC);

-- Sequence + trigger for invoice number
CREATE SEQUENCE IF NOT EXISTS public.credit_invoice_seq;

CREATE OR REPLACE FUNCTION public.set_credit_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMM') || '-' ||
      LPAD(nextval('public.credit_invoice_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_credit_invoices_set_number
BEFORE INSERT ON public.credit_invoices
FOR EACH ROW EXECUTE FUNCTION public.set_credit_invoice_number();

-- Status validation trigger (no CHECK constraint on time-based)
CREATE OR REPLACE FUNCTION public.validate_credit_invoice_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','awaiting_payment','paid','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_credit_invoices_validate_status
BEFORE INSERT OR UPDATE ON public.credit_invoices
FOR EACH ROW EXECUTE FUNCTION public.validate_credit_invoice_status();

CREATE TRIGGER trg_credit_invoices_updated_at
BEFORE UPDATE ON public.credit_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== RLS =====
ALTER TABLE public.credit_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talents view own invoices"
ON public.credit_invoices FOR SELECT
TO authenticated
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  OR public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Talents create own pending invoices"
ON public.credit_invoices FOR INSERT
TO authenticated
WITH CHECK (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  AND status = 'pending'
  AND credits_disbursed = false
);

CREATE POLICY "Admins update invoices"
ON public.credit_invoices FOR UPDATE
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins delete invoices"
ON public.credit_invoices FOR DELETE
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- ===== RPCs =====
CREATE OR REPLACE FUNCTION public.create_credit_invoice(
  p_bundle_credits integer,
  p_bundle_price_usd numeric,
  p_bundle_price_local numeric DEFAULT NULL,
  p_currency text DEFAULT 'USD'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_invoice_id uuid;
  v_invoice_number text;
BEGIN
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = auth.uid();
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  INSERT INTO public.credit_invoices (
    talent_id, bundle_credits, bundle_price_usd, bundle_price_local, currency,
    status, channel, whatsapp_message_sent
  ) VALUES (
    v_talent_id, p_bundle_credits, p_bundle_price_usd, p_bundle_price_local, COALESCE(p_currency,'USD'),
    'pending', 'whatsapp', true
  )
  RETURNING id, invoice_number INTO v_invoice_id, v_invoice_number;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_invoice_and_disburse(
  p_invoice_id uuid,
  p_payment_method text,
  p_payment_reference text DEFAULT NULL,
  p_payment_proof_url text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_current_balance numeric;
  v_new_balance numeric;
  v_txn_id uuid;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_invoice FROM public.credit_invoices WHERE id = p_invoice_id FOR UPDATE;
  IF v_invoice IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
  END IF;
  IF v_invoice.credits_disbursed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credits already disbursed');
  END IF;
  IF v_invoice.status NOT IN ('pending','awaiting_payment') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invoice not in an approvable state');
  END IF;

  -- Update wallet
  SELECT balance INTO v_current_balance
  FROM public.talent_credits WHERE talent_id = v_invoice.talent_id FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
    INSERT INTO public.talent_credits (talent_id, balance, earned_balance)
    VALUES (v_invoice.talent_id, 0, 0);
  END IF;

  v_new_balance := v_current_balance + v_invoice.bundle_credits;

  UPDATE public.talent_credits
  SET balance = v_new_balance
  WHERE talent_id = v_invoice.talent_id;

  -- Create credit transaction
  INSERT INTO public.credit_transactions (
    talent_id, amount, balance_after, transaction_type, service_type,
    reference_id, description, is_earned
  ) VALUES (
    v_invoice.talent_id, v_invoice.bundle_credits, v_new_balance,
    'whatsapp_purchase', 'credit_purchase', v_invoice.id,
    'Credit purchase via WhatsApp — Invoice ' || v_invoice.invoice_number,
    false
  )
  RETURNING id INTO v_txn_id;

  -- Update invoice
  UPDATE public.credit_invoices
  SET status = 'paid',
      payment_method = COALESCE(p_payment_method, payment_method),
      payment_reference = COALESCE(p_payment_reference, payment_reference),
      payment_proof_url = COALESCE(p_payment_proof_url, payment_proof_url),
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      credits_disbursed = true,
      credit_transaction_id = v_txn_id,
      approved_by = auth.uid(),
      paid_at = now()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'credits_added', v_invoice.bundle_credits,
    'new_balance', v_new_balance,
    'transaction_id', v_txn_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_invoice(
  p_invoice_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
BEGIN
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_invoice FROM public.credit_invoices WHERE id = p_invoice_id FOR UPDATE;
  IF v_invoice IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
  END IF;
  IF v_invoice.credits_disbursed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel a paid invoice');
  END IF;

  UPDATE public.credit_invoices
  SET status = 'cancelled',
      cancellation_reason = p_reason,
      approved_by = auth.uid()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ===== Storage bucket for payment proofs =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins manage payment proofs"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_any_admin_role(auth.uid()))
WITH CHECK (bucket_id = 'payment-proofs' AND public.has_any_admin_role(auth.uid()));

CREATE POLICY "Talents read own payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.credit_invoices ci
    JOIN public.talents t ON t.id = ci.talent_id
    WHERE t.user_id = auth.uid()
      AND ci.payment_proof_url LIKE '%' || storage.objects.name || '%'
  )
);
