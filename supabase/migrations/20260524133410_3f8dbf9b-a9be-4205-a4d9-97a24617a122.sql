-- B3: feature_waitlist table + RPCs
CREATE TABLE public.feature_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key text NOT NULL,
  user_id uuid NULL,
  email text NULL,
  source_path text NULL,
  user_agent text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_waitlist_identity_chk CHECK (user_id IS NOT NULL OR email IS NOT NULL),
  CONSTRAINT feature_waitlist_key_len_chk CHECK (char_length(feature_key) BETWEEN 1 AND 80)
);

CREATE UNIQUE INDEX feature_waitlist_user_uniq
  ON public.feature_waitlist (user_id, feature_key)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX feature_waitlist_email_uniq
  ON public.feature_waitlist (lower(email), feature_key)
  WHERE email IS NOT NULL AND user_id IS NULL;

CREATE INDEX feature_waitlist_key_created_idx
  ON public.feature_waitlist (feature_key, created_at DESC);

ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join a waitlist"
  ON public.feature_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all waitlist entries"
  ON public.feature_waitlist
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own waitlist entries"
  ON public.feature_waitlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RPC: join_feature_waitlist
CREATE OR REPLACE FUNCTION public.join_feature_waitlist(
  _feature_key text,
  _email text DEFAULT NULL,
  _source_path text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _norm_email text := NULL;
  _new_id uuid;
  _existing_id uuid;
BEGIN
  IF _feature_key IS NULL OR _feature_key !~ '^[a-z0-9][a-z0-9-]{0,79}$' THEN
    RAISE EXCEPTION 'invalid_argument: feature_key must match ^[a-z0-9][a-z0-9-]{0,79}$';
  END IF;

  IF _email IS NOT NULL THEN
    _norm_email := lower(trim(_email));
    IF _norm_email = '' OR _norm_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      RAISE EXCEPTION 'invalid_argument: email is not valid';
    END IF;
  END IF;

  IF _uid IS NULL AND _norm_email IS NULL THEN
    RAISE EXCEPTION 'invalid_argument: email required for anonymous joins';
  END IF;

  INSERT INTO public.feature_waitlist (feature_key, user_id, email, source_path, metadata)
  VALUES (
    _feature_key,
    _uid,
    CASE WHEN _uid IS NULL THEN _norm_email ELSE _norm_email END,
    _source_path,
    COALESCE(_metadata, '{}'::jsonb)
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO _new_id;

  IF _new_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'joined', 'id', _new_id);
  END IF;

  IF _uid IS NOT NULL THEN
    SELECT id INTO _existing_id
      FROM public.feature_waitlist
     WHERE user_id = _uid AND feature_key = _feature_key
     LIMIT 1;
  ELSE
    SELECT id INTO _existing_id
      FROM public.feature_waitlist
     WHERE user_id IS NULL AND lower(email) = _norm_email AND feature_key = _feature_key
     LIMIT 1;
  END IF;

  RETURN jsonb_build_object('status', 'already_joined', 'id', _existing_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_feature_waitlist(text, text, text, jsonb) TO anon, authenticated;

-- RPC: get_feature_waitlist_signals (admin-only)
CREATE OR REPLACE FUNCTION public.get_feature_waitlist_signals(_limit int DEFAULT 50)
RETURNS TABLE (
  feature_key text,
  total bigint,
  last_24h bigint,
  last_7d bigint,
  latest_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
    SELECT
      fw.feature_key,
      count(*)::bigint AS total,
      count(*) FILTER (WHERE fw.created_at > now() - interval '24 hours')::bigint AS last_24h,
      count(*) FILTER (WHERE fw.created_at > now() - interval '7 days')::bigint AS last_7d,
      max(fw.created_at) AS latest_at
    FROM public.feature_waitlist fw
    GROUP BY fw.feature_key
    ORDER BY total DESC, latest_at DESC
    LIMIT GREATEST(_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_feature_waitlist_signals(int) TO authenticated;