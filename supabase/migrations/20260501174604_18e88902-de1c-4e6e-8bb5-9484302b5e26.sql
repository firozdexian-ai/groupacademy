
CREATE OR REPLACE FUNCTION public.sync_instructor_to_ai_agent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.ai_agents (
    agent_key, name, description, system_prompt, avatar_url, expertise_areas,
    is_active, agent_type, category, color, bg_color,
    message_credit_cost, delivery_credit_cost, connection_fee,
    marketplace_status, visibility, owner_kind
  )
  VALUES (
    'instructor:' || NEW.id::text,
    NEW.name,
    COALESCE(NEW.persona, 'Academy instructor'),
    COALESCE(NEW.system_prompt, NEW.persona, 'You are an Academy instructor.'),
    NEW.avatar_url, NEW.expertise_areas,
    COALESCE(NEW.is_active, true),
    'specialized', 'instructor', '#2A7DDE', '#2A7DDE',
    1, 1, 0, 'approved', 'public', 'platform'
  )
  ON CONFLICT (agent_key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        system_prompt = EXCLUDED.system_prompt,
        avatar_url = EXCLUDED.avatar_url,
        expertise_areas = EXCLUDED.expertise_areas,
        is_active = EXCLUDED.is_active;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_instructor_agent ON public.ai_instructors;
CREATE TRIGGER trg_sync_instructor_agent
  AFTER INSERT OR UPDATE ON public.ai_instructors
  FOR EACH ROW EXECUTE FUNCTION public.sync_instructor_to_ai_agent();

INSERT INTO public.ai_agents (
  agent_key, name, description, system_prompt, avatar_url, expertise_areas,
  is_active, agent_type, category, color, bg_color,
  message_credit_cost, delivery_credit_cost, connection_fee,
  marketplace_status, visibility, owner_kind
)
SELECT
  'instructor:' || i.id::text,
  i.name,
  COALESCE(i.persona, 'Academy instructor'),
  COALESCE(i.system_prompt, i.persona, 'You are an Academy instructor.'),
  i.avatar_url, i.expertise_areas,
  COALESCE(i.is_active, true),
  'specialized', 'instructor', '#2A7DDE', '#2A7DDE',
  1, 1, 0, 'approved', 'public', 'platform'
FROM public.ai_instructors i
ON CONFLICT (agent_key) DO NOTHING;

INSERT INTO public.message_threads (
  talent_id, thread_type, agent_key, last_message_at,
  last_message_preview, last_message_sender, unread_count, is_pinned, is_archived
)
SELECT s.talent_id, 'agent', s.agent_key, MAX(s.updated_at), NULL, 'agent', 0, false, false
FROM public.agent_chat_sessions s
WHERE s.talent_id IS NOT NULL AND s.agent_key IS NOT NULL
GROUP BY s.talent_id, s.agent_key
ON CONFLICT DO NOTHING;

INSERT INTO public.agent_connections (agent_id, subject_kind, subject_id, fee_paid, connected_at)
SELECT a.id, 'talent', s.talent_id, 0, MIN(s.created_at)
FROM public.agent_chat_sessions s
JOIN public.ai_agents a ON a.agent_key = s.agent_key
WHERE s.talent_id IS NOT NULL
GROUP BY a.id, s.talent_id
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_agent_connected(_agent_key TEXT, _talent_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_connections c
    JOIN public.ai_agents a ON a.id = c.agent_id
    WHERE a.agent_key = _agent_key AND c.subject_kind = 'talent' AND c.subject_id = _talent_id
  );
$$;

CREATE OR REPLACE FUNCTION public.connect_agent(_agent_key TEXT, _talent_id UUID, _fee NUMERIC DEFAULT 0)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _agent_id UUID;
BEGIN
  SELECT id INTO _agent_id FROM public.ai_agents WHERE agent_key = _agent_key;
  IF _agent_id IS NULL THEN RAISE EXCEPTION 'Agent not found: %', _agent_key; END IF;
  INSERT INTO public.agent_connections (agent_id, subject_kind, subject_id, fee_paid)
  VALUES (_agent_id, 'talent', _talent_id, COALESCE(_fee, 0))
  ON CONFLICT (agent_id, subject_kind, subject_id) DO NOTHING;
END; $$;
