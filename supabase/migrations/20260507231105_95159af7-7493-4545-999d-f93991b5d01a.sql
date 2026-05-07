
CREATE OR REPLACE FUNCTION public.add_credits(
  p_talent_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_transaction_type text DEFAULT 'manual_topup'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_new_balance numeric;
BEGIN
  -- Allow system/service-role (auth.uid() IS NULL) or admin callers
  IF v_caller IS NOT NULL AND NOT public.has_any_admin_role(v_caller) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- UPSERT: ensures the UPDATE path fires the audit_credits_changes trigger
  INSERT INTO public.talent_credits (talent_id, balance)
  VALUES (p_talent_id, p_amount)
  ON CONFLICT (talent_id) DO UPDATE
    SET balance = public.talent_credits.balance + EXCLUDED.balance,
        updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- Ledger entry
  INSERT INTO public.credit_transactions (
    talent_id, amount, balance_after, transaction_type, description
  ) VALUES (
    p_talent_id,
    p_amount,
    v_new_balance,
    p_transaction_type,
    COALESCE(p_description, p_transaction_type || ' - ' || p_amount || ' credits')
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'added', p_amount
  );
END;
$function$;
