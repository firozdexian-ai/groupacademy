-- Workforce-as-a-Service: extend agent_threads to support hired instances
-- and channel-native subjects (Telegram chats, WhatsApp jids, etc.)

ALTER TABLE public.agent_threads
  ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES public.workforce_hired_instances(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_subject_id text;

ALTER TABLE public.agent_threads ALTER COLUMN agent_id DROP NOT NULL;
ALTER TABLE public.agent_threads ALTER COLUMN subject_id DROP NOT NULL;

-- Replace the restrictive subject_kind CHECK with a broader allow-list
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.agent_threads'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%subject_kind%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.agent_threads DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.agent_threads
  ADD CONSTRAINT agent_threads_subject_kind_chk
  CHECK (subject_kind IN (
    'talent','company','company_user','admin','system',
    'telegram_user','whatsapp_user','sms_user','web_user','headless_user'
  ));

-- Either a platform subject_id OR an external_subject_id must be present
ALTER TABLE public.agent_threads
  DROP CONSTRAINT IF EXISTS agent_threads_subject_present_chk;
ALTER TABLE public.agent_threads
  ADD CONSTRAINT agent_threads_subject_present_chk
  CHECK (subject_id IS NOT NULL OR external_subject_id IS NOT NULL);

-- And either a legacy agent_id OR a workforce instance_id must be present
ALTER TABLE public.agent_threads
  DROP CONSTRAINT IF EXISTS agent_threads_agent_or_instance_chk;
ALTER TABLE public.agent_threads
  ADD CONSTRAINT agent_threads_agent_or_instance_chk
  CHECK (agent_id IS NOT NULL OR instance_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_threads_instance_subject
  ON public.agent_threads(instance_id, subject_kind, external_subject_id, last_message_at DESC)
  WHERE instance_id IS NOT NULL;
