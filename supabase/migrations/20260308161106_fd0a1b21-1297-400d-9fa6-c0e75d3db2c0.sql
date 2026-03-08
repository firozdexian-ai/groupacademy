
CREATE TABLE public.email_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  resend_id text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

-- Admin read-only
CREATE POLICY "Admins can view email logs"
  ON public.email_notifications_log
  FOR SELECT
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

-- Create index for lookups
CREATE INDEX idx_email_log_talent ON public.email_notifications_log(talent_id);
CREATE INDEX idx_email_log_type ON public.email_notifications_log(email_type, created_at DESC);
