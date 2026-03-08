
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  is_secret boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform settings"
ON public.platform_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert platform settings"
ON public.platform_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_settings (key, value, description, is_secret) VALUES
  ('payment_gateway', 'whatsapp', 'Active payment gateway: whatsapp, stripe, or both', false),
  ('stripe_publishable_key', null, 'Stripe publishable key for client-side checkout', false),
  ('stripe_mode', 'test', 'Stripe environment: test or live', false),
  ('currency', 'USD', 'Default platform currency', false),
  ('whatsapp_purchase_enabled', 'true', 'Whether WhatsApp credit purchase is enabled', false);
