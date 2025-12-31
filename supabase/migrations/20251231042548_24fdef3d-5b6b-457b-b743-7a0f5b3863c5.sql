-- Add onboarding tracking columns to talents table
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Create function to grant welcome bonus credits
CREATE OR REPLACE FUNCTION public.grant_welcome_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert welcome bonus credits (only if no record exists)
  INSERT INTO public.talent_credits (talent_id, balance)
  VALUES (NEW.id, 250)
  ON CONFLICT (talent_id) DO NOTHING;
  
  -- Only record transaction if this was actually inserted (first time)
  IF FOUND THEN
    INSERT INTO public.credit_transactions (talent_id, amount, balance_after, transaction_type, description)
    VALUES (NEW.id, 250, 250, 'welcome_bonus', 'Welcome bonus - 250 credits to get started!');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-grant welcome bonus when talent is created
DROP TRIGGER IF EXISTS on_talent_created_grant_bonus ON public.talents;
CREATE TRIGGER on_talent_created_grant_bonus
  AFTER INSERT ON public.talents
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_bonus();