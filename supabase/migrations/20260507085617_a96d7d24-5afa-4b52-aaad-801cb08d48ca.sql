
-- Part A: Outreach + groups schema (additive)

ALTER TABLE public.messaging_conversations
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_kind text;

CREATE INDEX IF NOT EXISTS idx_msg_conv_contact ON public.messaging_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv_company_group
  ON public.messaging_conversations(company_id) WHERE is_group;

ALTER TABLE public.messaging_channels
  ADD COLUMN IF NOT EXISTS daily_outreach_cap   integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS hourly_outreach_cap  integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS min_gap_seconds      integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS quiet_hours_start    integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS quiet_hours_end      integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS quiet_hours_tz       text    NOT NULL DEFAULT 'Asia/Dhaka',
  ADD COLUMN IF NOT EXISTS reengage_window_days integer NOT NULL DEFAULT 14;

-- Partial unique index on whatsapp_number to support deterministic upserts during bulk import
CREATE UNIQUE INDEX IF NOT EXISTS contacts_whatsapp_unique
  ON public.contacts(whatsapp_number) WHERE whatsapp_number IS NOT NULL;

-- Group membership ledger
CREATE TABLE IF NOT EXISTS public.client_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.messaging_conversations(id) ON DELETE CASCADE,
  member_kind text NOT NULL CHECK (member_kind IN ('team','contact')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  whatsapp_id text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_cgm_conversation ON public.client_group_members(conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS cgm_active_unique
  ON public.client_group_members(conversation_id, whatsapp_id) WHERE removed_at IS NULL;

ALTER TABLE public.client_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage group members"
  ON public.client_group_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Outreach guardrail RPC (per-channel caps + quiet hours + re-engage window)
CREATE OR REPLACE FUNCTION public.outreach_can_send(
  p_channel_id uuid,
  p_contact_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ch record;
  v_today int;
  v_hour int;
  v_last timestamptz;
  v_secs_since int;
  v_local_hour int;
  v_last_to_contact timestamptz;
  v_days_since numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_admin');
  END IF;

  SELECT * INTO v_ch FROM public.messaging_channels WHERE id = p_channel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'channel_not_found');
  END IF;

  -- Quiet hours in channel TZ
  v_local_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE v_ch.quiet_hours_tz))::int;

  SELECT count(*) INTO v_today
  FROM public.messaging_messages m
  JOIN public.messaging_conversations c ON c.id = m.conversation_id
  WHERE c.channel_id = p_channel_id
    AND m.direction = 'out'
    AND m.created_at >= (now() AT TIME ZONE v_ch.quiet_hours_tz)::date AT TIME ZONE v_ch.quiet_hours_tz;

  SELECT count(*), max(m.created_at) INTO v_hour, v_last
  FROM public.messaging_messages m
  JOIN public.messaging_conversations c ON c.id = m.conversation_id
  WHERE c.channel_id = p_channel_id
    AND m.direction = 'out'
    AND m.created_at >= now() - interval '1 hour';

  v_secs_since := COALESCE(EXTRACT(EPOCH FROM (now() - v_last))::int, 999999);

  IF p_contact_id IS NOT NULL THEN
    SELECT max(m.created_at) INTO v_last_to_contact
    FROM public.messaging_messages m
    JOIN public.messaging_conversations c ON c.id = m.conversation_id
    WHERE c.contact_id = p_contact_id AND m.direction = 'out';
    v_days_since := COALESCE(EXTRACT(EPOCH FROM (now() - v_last_to_contact)) / 86400.0, 9999);
  END IF;

  RETURN jsonb_build_object(
    'ok', (
      v_today < v_ch.daily_outreach_cap
      AND v_hour < v_ch.hourly_outreach_cap
      AND v_secs_since >= v_ch.min_gap_seconds
      AND v_local_hour >= v_ch.quiet_hours_start
      AND v_local_hour < v_ch.quiet_hours_end
      AND (p_contact_id IS NULL OR v_last_to_contact IS NULL OR v_days_since >= v_ch.reengage_window_days)
    ),
    'reason', CASE
      WHEN v_today >= v_ch.daily_outreach_cap THEN 'daily_cap'
      WHEN v_hour >= v_ch.hourly_outreach_cap THEN 'hourly_cap'
      WHEN v_secs_since < v_ch.min_gap_seconds THEN 'min_gap'
      WHEN v_local_hour < v_ch.quiet_hours_start OR v_local_hour >= v_ch.quiet_hours_end THEN 'quiet_hours'
      WHEN p_contact_id IS NOT NULL AND v_last_to_contact IS NOT NULL AND v_days_since < v_ch.reengage_window_days THEN 'reengage_window'
      ELSE null
    END,
    'today', v_today,
    'today_cap', v_ch.daily_outreach_cap,
    'hour', v_hour,
    'hour_cap', v_ch.hourly_outreach_cap,
    'seconds_since_last', v_secs_since,
    'min_gap', v_ch.min_gap_seconds,
    'next_slot_seconds', GREATEST(0, v_ch.min_gap_seconds - v_secs_since),
    'local_hour', v_local_hour,
    'quiet_start', v_ch.quiet_hours_start,
    'quiet_end', v_ch.quiet_hours_end,
    'reengage_days_since', v_days_since,
    'reengage_window_days', v_ch.reengage_window_days
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.outreach_can_send(uuid, uuid) TO authenticated;
