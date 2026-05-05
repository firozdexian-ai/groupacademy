
-- ============ HYPE ============
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS hype_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.post_hypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  sender_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  recipient_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  credits_spent numeric(12,1) NOT NULL DEFAULT 1,
  creator_share numeric(12,1) NOT NULL DEFAULT 0.8,
  platform_share numeric(12,1) NOT NULL DEFAULT 0.2,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_hypes_post ON public.post_hypes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hypes_sender ON public.post_hypes(sender_talent_id);
CREATE INDEX IF NOT EXISTS idx_post_hypes_recipient ON public.post_hypes(recipient_talent_id);

ALTER TABLE public.post_hypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hypes are publicly readable"
  ON public.post_hypes FOR SELECT USING (true);

CREATE POLICY "Senders insert their own hypes"
  ON public.post_hypes FOR INSERT
  WITH CHECK (sender_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- ============ TALENT CONNECTIONS ============
CREATE TABLE IF NOT EXISTS public.talent_inbox_settings (
  talent_id uuid PRIMARY KEY REFERENCES public.talents(id) ON DELETE CASCADE,
  unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  unlock_method text CHECK (unlock_method IN ('threshold','paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_inbox_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inbox settings publicly readable"
  ON public.talent_inbox_settings FOR SELECT USING (true);

CREATE POLICY "Talent updates own inbox settings"
  ON public.talent_inbox_settings FOR UPDATE
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.talent_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  recipient_talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','refunded')),
  fee_paid numeric(12,1) NOT NULL,
  recipient_share numeric(12,1) NOT NULL DEFAULT 0,
  platform_share numeric(12,1) NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_talent_id, recipient_talent_id)
);
CREATE INDEX IF NOT EXISTS idx_tc_recipient ON public.talent_connections(recipient_talent_id, status);
CREATE INDEX IF NOT EXISTS idx_tc_sender ON public.talent_connections(sender_talent_id, status);

ALTER TABLE public.talent_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connections visible to sender or recipient"
  ON public.talent_connections FOR SELECT
  USING (
    sender_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    OR recipient_talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  );

-- ============ TRANSACTION VOLUME VIEW ============
CREATE OR REPLACE VIEW public.v_talent_transaction_volume AS
SELECT
  t.id AS talent_id,
  COALESCE(SUM(ABS(ct.amount)), 0)::numeric(14,1) AS volume
FROM public.talents t
LEFT JOIN public.credit_transactions ct ON ct.talent_id = t.id
GROUP BY t.id;

-- ============ PRICE FUNCTION ============
CREATE OR REPLACE FUNCTION public.get_talent_connection_price(_recipient uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(50, FLOOR(COALESCE(volume,0) * 0.01))::numeric
  FROM public.v_talent_transaction_volume
  WHERE talent_id = _recipient;
$$;

-- ============ HYPE RPC ============
CREATE OR REPLACE FUNCTION public.hype_post(_post_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sender uuid;
  v_recipient uuid;
  v_author_user uuid;
  v_bal numeric; v_earned numeric; v_bonus numeric;
  v_take numeric;
BEGIN
  SELECT id INTO v_sender FROM public.talents WHERE user_id = auth.uid();
  IF v_sender IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT author_user_id INTO v_author_user FROM public.feed_posts WHERE id = _post_id;
  IF v_author_user IS NULL THEN RAISE EXCEPTION 'POST_NOT_FOUND'; END IF;

  SELECT id INTO v_recipient FROM public.talents WHERE user_id = v_author_user;
  IF v_recipient IS NULL THEN RAISE EXCEPTION 'AUTHOR_NOT_TALENT'; END IF;
  IF v_recipient = v_sender THEN RAISE EXCEPTION 'CANNOT_HYPE_SELF'; END IF;

  -- debit sender 1 credit (bonus -> balance -> earned)
  SELECT balance, earned_balance, contact_bonus_balance
    INTO v_bal, v_earned, v_bonus
  FROM public.talent_credits WHERE talent_id = v_sender FOR UPDATE;

  IF COALESCE(v_bal,0)+COALESCE(v_earned,0)+COALESCE(v_bonus,0) < 1 THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  IF COALESCE(v_bonus,0) >= 1 THEN
    UPDATE public.talent_credits SET contact_bonus_balance = contact_bonus_balance - 1, updated_at=now() WHERE talent_id=v_sender;
  ELSIF COALESCE(v_bal,0) >= 1 THEN
    UPDATE public.talent_credits SET balance = balance - 1, updated_at=now() WHERE talent_id=v_sender;
  ELSE
    UPDATE public.talent_credits SET earned_balance = earned_balance - 1, updated_at=now() WHERE talent_id=v_sender;
  END IF;

  -- credit recipient 0.8
  v_take := 0.8;
  INSERT INTO public.talent_credits(talent_id, balance, earned_balance, contact_bonus_balance)
    VALUES (v_recipient, 0, v_take, 0)
    ON CONFLICT (talent_id) DO UPDATE
      SET earned_balance = public.talent_credits.earned_balance + v_take, updated_at = now();

  -- ledger entries
  INSERT INTO public.credit_transactions(talent_id, amount, balance_after, transaction_type, service_type, reference_id, description, source, is_earned)
    VALUES
      (v_sender, -1, NULL, 'spend', 'hype', _post_id, 'Hyped a post', 'hype_sent', false),
      (v_recipient, v_take, NULL, 'earn', 'hype', _post_id, 'Received Hype on post', 'hype_received', true);

  -- record + counter
  INSERT INTO public.post_hypes(post_id, sender_talent_id, recipient_talent_id) VALUES (_post_id, v_sender, v_recipient);
  UPDATE public.feed_posts SET hype_count = hype_count + 1 WHERE id = _post_id;

  RETURN jsonb_build_object('ok', true, 'post_id', _post_id);
END $$;

-- ============ INBOX UNLOCK ============
CREATE OR REPLACE FUNCTION public.unlock_talent_inbox()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_talent uuid; v_vol numeric; v_method text;
  v_bal numeric; v_earned numeric; v_bonus numeric;
BEGIN
  SELECT id INTO v_talent FROM public.talents WHERE user_id = auth.uid();
  IF v_talent IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT volume INTO v_vol FROM public.v_talent_transaction_volume WHERE talent_id = v_talent;

  IF COALESCE(v_vol,0) >= 5000 THEN
    v_method := 'threshold';
  ELSE
    SELECT balance, earned_balance, contact_bonus_balance INTO v_bal, v_earned, v_bonus
      FROM public.talent_credits WHERE talent_id = v_talent FOR UPDATE;
    IF COALESCE(v_bal,0)+COALESCE(v_earned,0)+COALESCE(v_bonus,0) < 5000 THEN
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS_OR_VOLUME';
    END IF;
    -- spend 5000 in order
    DECLARE rem numeric := 5000; take numeric;
    BEGIN
      take := LEAST(rem, COALESCE(v_bonus,0));
      IF take > 0 THEN UPDATE public.talent_credits SET contact_bonus_balance = contact_bonus_balance - take WHERE talent_id=v_talent; rem := rem - take; END IF;
      take := LEAST(rem, COALESCE(v_bal,0));
      IF take > 0 THEN UPDATE public.talent_credits SET balance = balance - take WHERE talent_id=v_talent; rem := rem - take; END IF;
      IF rem > 0 THEN UPDATE public.talent_credits SET earned_balance = earned_balance - rem WHERE talent_id=v_talent; END IF;
    END;
    INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, description, source, is_earned)
      VALUES (v_talent, -5000, 'spend', 'inbox_unlock', 'Unlocked talent inbox', 'inbox_unlock', false);
    v_method := 'paid';
  END IF;

  INSERT INTO public.talent_inbox_settings(talent_id, unlocked, unlocked_at, unlock_method)
    VALUES (v_talent, true, now(), v_method)
    ON CONFLICT (talent_id) DO UPDATE SET unlocked=true, unlocked_at=now(), unlock_method=v_method, updated_at=now();

  RETURN jsonb_build_object('ok', true, 'method', v_method);
END $$;

-- ============ CONNECTION REQUEST ============
CREATE OR REPLACE FUNCTION public.talent_connection_request(_recipient uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sender uuid; v_fee numeric; v_unlocked boolean;
  v_bal numeric; v_earned numeric; v_bonus numeric;
  v_id uuid; rem numeric; take numeric;
BEGIN
  SELECT id INTO v_sender FROM public.talents WHERE user_id = auth.uid();
  IF v_sender IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF v_sender = _recipient THEN RAISE EXCEPTION 'CANNOT_CONNECT_SELF'; END IF;

  SELECT unlocked INTO v_unlocked FROM public.talent_inbox_settings WHERE talent_id = _recipient;
  IF NOT COALESCE(v_unlocked,false) THEN RAISE EXCEPTION 'RECIPIENT_INBOX_LOCKED'; END IF;

  v_fee := public.get_talent_connection_price(_recipient);

  SELECT balance, earned_balance, contact_bonus_balance INTO v_bal, v_earned, v_bonus
    FROM public.talent_credits WHERE talent_id = v_sender FOR UPDATE;
  IF COALESCE(v_bal,0)+COALESCE(v_earned,0)+COALESCE(v_bonus,0) < v_fee THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  rem := v_fee;
  take := LEAST(rem, COALESCE(v_bonus,0));
  IF take > 0 THEN UPDATE public.talent_credits SET contact_bonus_balance = contact_bonus_balance - take WHERE talent_id=v_sender; rem := rem - take; END IF;
  take := LEAST(rem, COALESCE(v_bal,0));
  IF take > 0 THEN UPDATE public.talent_credits SET balance = balance - take WHERE talent_id=v_sender; rem := rem - take; END IF;
  IF rem > 0 THEN UPDATE public.talent_credits SET earned_balance = earned_balance - rem WHERE talent_id=v_sender; END IF;

  INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, description, source, is_earned)
    VALUES (v_sender, -v_fee, 'spend', 'connection_request', 'Connection request fee (escrow)', 'connection_fee_sent', false);

  INSERT INTO public.talent_connections(sender_talent_id, recipient_talent_id, fee_paid)
    VALUES (v_sender, _recipient, v_fee)
    ON CONFLICT (sender_talent_id, recipient_talent_id) DO UPDATE
      SET status='pending', fee_paid=EXCLUDED.fee_paid, expires_at=now()+interval '14 days', responded_at=NULL, created_at=now()
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'fee', v_fee);
END $$;

-- ============ CONNECTION RESPONSE ============
CREATE OR REPLACE FUNCTION public.talent_connection_respond(_request uuid, _accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid; r record; v_recipient_share numeric;
BEGIN
  SELECT id INTO v_me FROM public.talents WHERE user_id = auth.uid();
  IF v_me IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  SELECT * INTO r FROM public.talent_connections WHERE id = _request FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.recipient_talent_id <> v_me THEN RAISE EXCEPTION 'NOT_RECIPIENT'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_RESPONDED'; END IF;

  IF _accept THEN
    v_recipient_share := ROUND(r.fee_paid * 0.7, 1);
    UPDATE public.talent_credits SET earned_balance = earned_balance + v_recipient_share, updated_at=now() WHERE talent_id = v_me;
    INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, reference_id, description, source, is_earned)
      VALUES (v_me, v_recipient_share, 'earn', 'connection_request', r.id, 'Accepted connection request', 'connection_fee_received', true);
    UPDATE public.talent_connections
      SET status='accepted', responded_at=now(), recipient_share=v_recipient_share, platform_share = r.fee_paid - v_recipient_share
      WHERE id = r.id;
  ELSE
    -- refund sender
    UPDATE public.talent_credits SET balance = balance + r.fee_paid, updated_at=now() WHERE talent_id = r.sender_talent_id;
    INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, reference_id, description, source, is_earned)
      VALUES (r.sender_talent_id, r.fee_paid, 'refund', 'connection_request', r.id, 'Connection request declined - refund', 'connection_fee_refund', false);
    UPDATE public.talent_connections SET status='declined', responded_at=now() WHERE id = r.id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.hype_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_talent_inbox() TO authenticated;
GRANT EXECUTE ON FUNCTION public.talent_connection_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.talent_connection_respond(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_talent_connection_price(uuid) TO authenticated, anon;
GRANT SELECT ON public.v_talent_transaction_volume TO authenticated, anon;
