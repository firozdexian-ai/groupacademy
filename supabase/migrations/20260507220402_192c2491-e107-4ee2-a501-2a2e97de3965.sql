ALTER TABLE public.fin_payment_configs
  ADD COLUMN IF NOT EXISTS account_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;