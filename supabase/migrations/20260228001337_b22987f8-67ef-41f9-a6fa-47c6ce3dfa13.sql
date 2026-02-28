
-- Fix deduct_credits to cast reference_id properly
CREATE OR REPLACE FUNCTION public.deduct_credits(p_amount integer, p_service_type text, p_reference_id text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_talent_id uuid;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  SELECT id INTO v_talent_id
  FROM talents
  WHERE user_id = auth.uid();
  
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  SELECT balance INTO v_current_balance
  FROM talent_credits
  WHERE talent_id = v_talent_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit balance found');
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', p_amount,
      'available', v_current_balance
    );
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  UPDATE talent_credits
  SET balance = v_new_balance
  WHERE talent_id = v_talent_id;
  
  INSERT INTO credit_transactions (
    talent_id,
    amount,
    balance_after,
    transaction_type,
    service_type,
    reference_id,
    description
  ) VALUES (
    v_talent_id,
    -p_amount,
    v_new_balance,
    'service_usage',
    p_service_type,
    CASE WHEN p_reference_id IS NOT NULL AND p_reference_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         THEN p_reference_id::uuid 
         ELSE NULL 
    END,
    COALESCE(p_description, 'Service: ' || p_service_type)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
END;
$function$;
