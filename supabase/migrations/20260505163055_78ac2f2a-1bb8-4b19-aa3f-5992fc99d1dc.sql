
DO $$ BEGIN CREATE TYPE public.messaging_provider AS ENUM ('whatsapp','telegram'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.messaging_channel_status AS ENUM ('pending','connected','disconnected','error'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.messaging_direction AS ENUM ('in','out'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.messaging_author AS ENUM ('user','agent','human_operator','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.messaging_status AS ENUM ('queued','sent','delivered','read','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.messaging_queue_status AS ENUM ('pending','processing','sent','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.messaging_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  provider public.messaging_provider NOT NULL,
  label text NOT NULL,
  region text,
  language text,
  unipile_account_id text UNIQUE,
  phone_e164 text,
  telegram_bot_id text UNIQUE,
  telegram_bot_username text,
  telegram_connection_key text,
  status public.messaging_channel_status NOT NULL DEFAULT 'pending',
  auto_reply_enabled boolean NOT NULL DEFAULT true,
  rate_limit_per_min integer NOT NULL DEFAULT 4,
  assigned_operator_ids uuid[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messaging_channels_agent_key ON public.messaging_channels(agent_key);
CREATE INDEX idx_messaging_channels_provider_status ON public.messaging_channels(provider, status);

CREATE TABLE public.messaging_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.messaging_channels(id) ON DELETE CASCADE,
  external_chat_id text NOT NULL,
  peer_handle text,
  peer_display_name text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer NOT NULL DEFAULT 0,
  auto_reply_paused boolean NOT NULL DEFAULT false,
  assigned_human_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, external_chat_id)
);
CREATE INDEX idx_messaging_conv_channel_last ON public.messaging_conversations(channel_id, last_message_at DESC);

CREATE TABLE public.messaging_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.messaging_conversations(id) ON DELETE CASCADE,
  external_message_id text,
  direction public.messaging_direction NOT NULL,
  author public.messaging_author NOT NULL,
  body text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.messaging_status NOT NULL DEFAULT 'sent',
  error text,
  agent_run_id uuid,
  sent_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messaging_messages_conv_created ON public.messaging_messages(conversation_id, created_at DESC);
CREATE UNIQUE INDEX idx_messaging_messages_external ON public.messaging_messages(conversation_id, external_message_id) WHERE external_message_id IS NOT NULL;

CREATE TABLE public.messaging_outbound_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.messaging_channels(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.messaging_conversations(id) ON DELETE SET NULL,
  to_handle text NOT NULL,
  body text NOT NULL,
  template_key text,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  status public.messaging_queue_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messaging_queue_status_sched ON public.messaging_outbound_queue(status, scheduled_for);
CREATE INDEX idx_messaging_queue_channel ON public.messaging_outbound_queue(channel_id);

CREATE TABLE public.messaging_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  provider public.messaging_provider,
  key text NOT NULL,
  name text NOT NULL,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_key, key)
);

CREATE OR REPLACE FUNCTION public.can_operate_messaging_channel(_user uuid, _channel uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user,'admin')
    OR EXISTS (
      SELECT 1 FROM public.messaging_channels c
      WHERE c.id = _channel
        AND public.has_role(_user,'talent_success_executive')
        AND _user = ANY (c.assigned_operator_ids)
    );
$$;

CREATE TRIGGER trg_messaging_channels_updated_at BEFORE UPDATE ON public.messaging_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_messaging_conversations_updated_at BEFORE UPDATE ON public.messaging_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_messaging_templates_updated_at BEFORE UPDATE ON public.messaging_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.messaging_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_outbound_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage messaging_channels" ON public.messaging_channels FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Operators read assigned channels" ON public.messaging_channels FOR SELECT
  USING (public.has_role(auth.uid(),'talent_success_executive') AND auth.uid() = ANY (assigned_operator_ids));

CREATE POLICY "Admins manage conversations" ON public.messaging_conversations FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Operators access assigned conversations" ON public.messaging_conversations FOR ALL
  USING (public.can_operate_messaging_channel(auth.uid(), channel_id))
  WITH CHECK (public.can_operate_messaging_channel(auth.uid(), channel_id));

CREATE POLICY "Admins manage messages" ON public.messaging_messages FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Operators access messages on assigned channels" ON public.messaging_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.messaging_conversations c
    WHERE c.id = conversation_id AND public.can_operate_messaging_channel(auth.uid(), c.channel_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.messaging_conversations c
    WHERE c.id = conversation_id AND public.can_operate_messaging_channel(auth.uid(), c.channel_id)));

CREATE POLICY "Admins manage outbound queue" ON public.messaging_outbound_queue FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Operators manage queue for assigned channels" ON public.messaging_outbound_queue FOR ALL
  USING (public.can_operate_messaging_channel(auth.uid(), channel_id))
  WITH CHECK (public.can_operate_messaging_channel(auth.uid(), channel_id));

CREATE POLICY "Admins manage templates" ON public.messaging_templates FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Operators read templates" ON public.messaging_templates FOR SELECT
  USING (public.has_role(auth.uid(),'talent_success_executive'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messaging_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messaging_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messaging_messages;
