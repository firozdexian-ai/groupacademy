
-- 1. agent_outreach: log of every headless agent message
CREATE TABLE IF NOT EXISTS public.agent_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  trigger_id uuid REFERENCES public.agent_triggers(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.platform_events(id) ON DELETE SET NULL,
  recipient_kind text NOT NULL CHECK (recipient_kind IN ('talent','company','admin','external')),
  recipient_id uuid,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','sms','webhook','push')),
  subject text,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('queued','sent','delivered','failed')),
  error_message text,
  credits_charged numeric(12,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_agent ON public.agent_outreach(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_recipient ON public.agent_outreach(recipient_kind, recipient_id, created_at DESC);

ALTER TABLE public.agent_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage outreach" ON public.agent_outreach
  FOR ALL USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Talents view own outreach" ON public.agent_outreach
  FOR SELECT USING (
    recipient_kind = 'talent'
    AND recipient_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  );

-- 2. headless_pool_charge: atomic debit with monthly cap + rollover
CREATE OR REPLACE FUNCTION public.headless_pool_charge(p_amount numeric, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool RECORD;
  v_new_balance numeric;
  v_new_spent numeric;
  v_current_month date := date_trunc('month', now())::date;
BEGIN
  SELECT * INTO v_pool FROM public.headless_pool WHERE id = 1 FOR UPDATE;
  IF v_pool IS NULL THEN
    INSERT INTO public.headless_pool (id) VALUES (1) RETURNING * INTO v_pool;
  END IF;

  -- Month rollover
  IF v_pool.month_anchor < v_current_month THEN
    UPDATE public.headless_pool
      SET spent_this_month = 0, month_anchor = v_current_month
      WHERE id = 1;
    v_pool.spent_this_month := 0;
    v_pool.month_anchor := v_current_month;
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', true, 'charged', 0, 'balance', v_pool.balance);
  END IF;

  IF v_pool.spent_this_month + p_amount > v_pool.monthly_cap THEN
    RETURN jsonb_build_object('success', false, 'error', 'Monthly cap reached',
      'cap', v_pool.monthly_cap, 'spent', v_pool.spent_this_month);
  END IF;

  IF v_pool.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient pool balance',
      'balance', v_pool.balance, 'required', p_amount);
  END IF;

  v_new_balance := v_pool.balance - p_amount;
  v_new_spent := v_pool.spent_this_month + p_amount;

  UPDATE public.headless_pool
    SET balance = v_new_balance,
        spent_this_month = v_new_spent,
        updated_at = now()
    WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'charged', p_amount,
    'balance', v_new_balance, 'spent_this_month', v_new_spent);
END;
$$;

-- 3. enqueue_platform_event helper
CREATE OR REPLACE FUNCTION public.enqueue_platform_event(
  p_event_kind text,
  p_subject_kind text DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.platform_events (event_kind, subject_kind, subject_id, payload)
  VALUES (p_event_kind, p_subject_kind, p_subject_id, COALESCE(p_payload, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 4. Auto-emit talent.signup event
CREATE OR REPLACE FUNCTION public.emit_talent_signup_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_platform_event(
    'talent.signup',
    'talent',
    NEW.id,
    jsonb_build_object('email', NEW.email, 'full_name', NEW.full_name, 'country', NEW.country)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_talent_signup ON public.talents;
CREATE TRIGGER trg_emit_talent_signup
  AFTER INSERT ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.emit_talent_signup_event();
