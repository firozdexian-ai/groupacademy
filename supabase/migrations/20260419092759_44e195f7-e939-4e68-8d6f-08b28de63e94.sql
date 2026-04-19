-- Welcome bonus = non-withdrawable. Goes into balance only, NOT earned_balance.
CREATE OR REPLACE FUNCTION public.grant_welcome_bonus()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert welcome bonus credits into spendable balance only.
  -- earned_balance stays at 0 so the bonus is non-withdrawable.
  INSERT INTO public.talent_credits (talent_id, balance, earned_balance)
  VALUES (NEW.id, 250, 0)
  ON CONFLICT (talent_id) DO NOTHING;

  -- Only record transaction if this row was actually inserted (first time).
  IF FOUND THEN
    INSERT INTO public.credit_transactions (
      talent_id, amount, balance_after, transaction_type, description, is_earned
    )
    VALUES (
      NEW.id, 250, 250, 'welcome_bonus',
      'Welcome bonus - 250 credits to get started! (non-withdrawable)',
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;