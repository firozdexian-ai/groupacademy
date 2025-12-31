-- Create talent_credits table for credit balance tracking
CREATE TABLE public.talent_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT talent_credits_talent_id_key UNIQUE (talent_id)
);

-- Create credit_transactions table for transaction history
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  service_type TEXT,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.talent_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for talent_credits
CREATE POLICY "Users can view their own credits"
  ON public.talent_credits FOR SELECT
  USING (
    talent_id IN (
      SELECT id FROM public.talents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert credits"
  ON public.talent_credits FOR INSERT
  WITH CHECK (
    talent_id IN (
      SELECT id FROM public.talents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can update credits"
  ON public.talent_credits FOR UPDATE
  USING (
    talent_id IN (
      SELECT id FROM public.talents WHERE user_id = auth.uid()
    )
  );

-- RLS policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    talent_id IN (
      SELECT id FROM public.talents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (
    talent_id IN (
      SELECT id FROM public.talents WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_talent_credits_talent_id ON public.talent_credits(talent_id);
CREATE INDEX idx_credit_transactions_talent_id ON public.credit_transactions(talent_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Create updated_at trigger for talent_credits
CREATE TRIGGER update_talent_credits_updated_at
  BEFORE UPDATE ON public.talent_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();