CREATE TABLE IF NOT EXISTS public.agent_pitch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  sent_by uuid NOT NULL,
  message text NOT NULL,
  phone text,
  dispatched boolean NOT NULL DEFAULT false,
  dispatch_error text,
  external_message_id text,
  external_chat_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_pitch_log_company ON public.agent_pitch_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_pitch_log_talent ON public.agent_pitch_log(talent_id);

ALTER TABLE public.agent_pitch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their pitch log"
ON public.agent_pitch_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = agent_pitch_log.company_id
      AND cm.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
);