CREATE TABLE IF NOT EXISTS public.talent_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','sms','in_app')),
  subject text,
  message text,
  template text,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','responded','signed_up')),
  response_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_talent_outreach_log_talent ON public.talent_outreach_log(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_outreach_log_sent_at ON public.talent_outreach_log(sent_at DESC);
ALTER TABLE public.talent_outreach_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage outreach log" ON public.talent_outreach_log;
CREATE POLICY "Admins manage outreach log" ON public.talent_outreach_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE INDEX IF NOT EXISTS idx_talents_unregistered ON public.talents(created_at DESC) WHERE user_id IS NULL;