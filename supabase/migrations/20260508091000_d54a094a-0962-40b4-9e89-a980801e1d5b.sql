
DROP VIEW IF EXISTS public.agent_outreach_admin_v;
CREATE VIEW public.agent_outreach_admin_v
WITH (security_invoker = on) AS
SELECT
  o.id, o.created_at, o.status, o.channel, o.recipient_kind, o.recipient_id,
  o.subject, o.body, o.credits_charged, o.error_message, o.external_message_id,
  o.conversation_id, o.event_id, o.trigger_id,
  a.agent_key, a.name AS agent_name,
  t.event_kind
FROM public.agent_outreach o
LEFT JOIN public.ai_agents a ON a.id = o.agent_id
LEFT JOIN public.agent_triggers t ON t.id = o.trigger_id;

GRANT SELECT ON public.agent_outreach_admin_v TO authenticated;

-- Ensure agent_outreach is readable by admins so the view returns data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_outreach' AND policyname='admins read outreach') THEN
    EXECUTE $p$CREATE POLICY "admins read outreach" ON public.agent_outreach
      FOR SELECT USING (public.has_role(auth.uid(),'admin'))$p$;
  END IF;
END $$;
