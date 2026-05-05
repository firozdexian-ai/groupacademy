
-- Phase 3: Connections inbox plumbing
-- Allow talent-to-talent threads
ALTER TABLE public.message_threads DROP CONSTRAINT IF EXISTS message_threads_thread_type_check;
ALTER TABLE public.message_threads ADD CONSTRAINT message_threads_thread_type_check
  CHECK (thread_type = ANY (ARRAY['agent','system','peer']));
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS peer_talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS message_threads_peer_uniq
  ON public.message_threads(LEAST(talent_id, peer_talent_id), GREATEST(talent_id, peer_talent_id))
  WHERE thread_type = 'peer';

-- Notification on connection request created
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT full_name INTO sender_name FROM public.talents WHERE id = NEW.sender_talent_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(talent_id, type, title, message, icon, link)
    VALUES (NEW.recipient_talent_id, 'connection_request',
      'New connection request',
      COALESCE(sender_name,'Someone') || ' wants to connect (' || NEW.fee_paid || ' credits escrowed).',
      'sparkles', '/app/connections');
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications(talent_id, type, title, message, icon, link)
      VALUES (NEW.sender_talent_id, 'connection_accepted',
        'Connection accepted',
        (SELECT full_name FROM public.talents WHERE id = NEW.recipient_talent_id) || ' accepted your request. You can now message.',
        'check', '/app/connections');
    ELSIF NEW.status IN ('declined','expired','refunded') THEN
      INSERT INTO public.notifications(talent_id, type, title, message, icon, link)
      VALUES (NEW.sender_talent_id, 'connection_'||NEW.status,
        'Connection ' || NEW.status,
        'Your ' || NEW.fee_paid || ' credit fee was refunded.',
        'undo', '/app/connections');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_connection_request ON public.talent_connections;
CREATE TRIGGER trg_notify_connection_request
AFTER INSERT OR UPDATE ON public.talent_connections
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

-- Sweep expired connections (refund + mark expired). Run via cron.
CREATE OR REPLACE FUNCTION public.sweep_expired_connections()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c record;
  cnt integer := 0;
BEGIN
  FOR c IN SELECT * FROM public.talent_connections
    WHERE status = 'pending' AND expires_at < now()
  LOOP
    UPDATE public.talent_credits
      SET balance = balance + c.fee_paid
      WHERE talent_id = c.sender_talent_id;
    INSERT INTO public.credits_ledger(talent_id, delta, source, ref_id, notes)
    VALUES (c.sender_talent_id, c.fee_paid, 'connection_fee_refund', c.id, 'Connection request expired');
    UPDATE public.talent_connections SET status = 'expired', responded_at = now() WHERE id = c.id;
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END;
$$;

-- Phase 4: Creator badge auto-grant
CREATE TABLE IF NOT EXISTS public.creator_badges (
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  badge text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (talent_id, badge)
);
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_badges public read" ON public.creator_badges FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.maybe_grant_hype_badges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total bigint;
BEGIN
  SELECT COUNT(*) INTO total FROM public.post_hypes WHERE recipient_talent_id = NEW.recipient_talent_id;
  IF total >= 500 THEN
    INSERT INTO public.creator_badges(talent_id, badge) VALUES (NEW.recipient_talent_id, 'hype_500') ON CONFLICT DO NOTHING;
  END IF;
  IF total >= 1000 THEN
    INSERT INTO public.creator_badges(talent_id, badge) VALUES (NEW.recipient_talent_id, 'hype_1k') ON CONFLICT DO NOTHING;
  END IF;
  IF total >= 5000 THEN
    INSERT INTO public.creator_badges(talent_id, badge) VALUES (NEW.recipient_talent_id, 'hype_5k') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_grant_hype_badges ON public.post_hypes;
CREATE TRIGGER trg_grant_hype_badges
AFTER INSERT ON public.post_hypes
FOR EACH ROW EXECUTE FUNCTION public.maybe_grant_hype_badges();

-- Helper: top hyped posts last 7 days view
CREATE OR REPLACE VIEW public.v_top_hyped_posts_week AS
SELECT post_id, COUNT(*) AS hypes_week
FROM public.post_hypes
WHERE created_at > now() - interval '7 days'
GROUP BY post_id
ORDER BY hypes_week DESC
LIMIT 10;

-- Accept-and-create-thread RPC: wraps existing respond + creates peer thread
CREATE OR REPLACE FUNCTION public.connection_accept_and_open_thread(_connection_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c record;
  me_talent uuid;
  thread_id uuid;
BEGIN
  SELECT id INTO me_talent FROM public.talents WHERE user_id = auth.uid();
  IF me_talent IS NULL THEN RAISE EXCEPTION 'no talent profile'; END IF;
  SELECT * INTO c FROM public.talent_connections WHERE id = _connection_id;
  IF c.recipient_talent_id <> me_talent THEN RAISE EXCEPTION 'not your request'; END IF;
  IF c.status <> 'pending' THEN RAISE EXCEPTION 'already responded'; END IF;
  PERFORM public.talent_connection_respond(_connection_id, 'accepted');
  -- create or fetch peer thread (one row per pair)
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
