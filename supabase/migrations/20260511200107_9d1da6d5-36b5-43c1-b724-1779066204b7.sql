ALTER TABLE public.agent_threads
  ADD COLUMN IF NOT EXISTS human_takeover_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'ai';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agent_threads_status_check'
      AND conrelid = 'public.agent_threads'::regclass
  ) THEN
    ALTER TABLE public.agent_threads
      ADD CONSTRAINT agent_threads_status_check
      CHECK (status IN ('ai', 'human', 'closed'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_agent_threads_status_lastmsg
  ON public.agent_threads (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_threads_assigned_admin
  ON public.agent_threads (assigned_admin_id);

-- Realtime: ensure full row payloads are streamed to admin clients.
ALTER TABLE public.agent_threads REPLICA IDENTITY FULL;
ALTER TABLE public.agent_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_threads';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_messages';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Note: an existing FOR ALL policy ("Admins manage all threads") already grants admins
-- full read/write/update on agent_threads via has_any_admin_role(auth.uid()),
-- so no new UPDATE policy is required. Same for agent_messages (admin-managed).