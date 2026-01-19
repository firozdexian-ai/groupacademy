-- Create secure RPC function for credit deduction
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_amount integer,
  p_service_type text,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Get the talent_id for the current user
  SELECT id INTO v_talent_id
  FROM talents
  WHERE user_id = auth.uid();
  
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get current balance with row lock to prevent race conditions
  SELECT balance INTO v_current_balance
  FROM talent_credits
  WHERE talent_id = v_talent_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit balance found');
  END IF;
  
  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', p_amount,
      'available', v_current_balance
    );
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update the balance
  UPDATE talent_credits
  SET balance = v_new_balance
  WHERE talent_id = v_talent_id;
  
  -- Record the transaction
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
    p_reference_id,
    COALESCE(p_description, 'Service: ' || p_service_type)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
END;
$$;

-- Create secure RPC function for adding credits (admin/system use)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_talent_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Only allow admins or system to add credits
  IF NOT public.has_any_admin_role(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get or create balance record
  SELECT balance INTO v_current_balance
  FROM talent_credits
  WHERE talent_id = p_talent_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    -- Create new record
    v_new_balance := p_amount;
    INSERT INTO talent_credits (talent_id, balance)
    VALUES (p_talent_id, v_new_balance);
  ELSE
    -- Update existing
    v_new_balance := v_current_balance + p_amount;
    UPDATE talent_credits
    SET balance = v_new_balance
    WHERE talent_id = p_talent_id;
  END IF;
  
  -- Record the transaction
  INSERT INTO credit_transactions (
    talent_id,
    amount,
    balance_after,
    transaction_type,
    description
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
$$;