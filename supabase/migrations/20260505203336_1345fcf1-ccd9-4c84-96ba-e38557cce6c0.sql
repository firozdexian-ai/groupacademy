CREATE OR REPLACE FUNCTION public.connection_accept_and_open_thread(_connection_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c record;
  me_talent uuid;
  thread_id uuid;
BEGIN
  SELECT id INTO me_talent FROM public.talents WHERE user_id = auth.uid();
  IF me_talent IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO c FROM public.talent_connections WHERE id = _connection_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF c.recipient_talent_id <> me_talent THEN RAISE EXCEPTION 'NOT_RECIPIENT'; END IF;
  IF c.status = 'pending' THEN
    PERFORM public.talent_connection_respond(_connection_id, true);
  END IF;
  INSERT INTO public.message_threads(talent_id, peer_talent_id, thread_type, last_message_at)
  VALUES (me_talent, c.sender_talent_id, 'peer', now())
  ON CONFLICT DO NOTHING;
  INSERT INTO public.message_threads(talent_id, peer_talent_id, thread_type, last_message_at)
  VALUES (c.sender_talent_id, me_talent, 'peer', now())
  ON CONFLICT DO NOTHING;
  SELECT id INTO thread_id FROM public.message_threads
    WHERE talent_id = me_talent AND peer_talent_id = c.sender_talent_id AND thread_type = 'peer'
    LIMIT 1;
  RETURN thread_id;
END;
$$;