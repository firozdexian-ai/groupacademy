
CREATE OR REPLACE FUNCTION public.instructor_session_rate_credits()
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$ SELECT 50.0::numeric $$;

CREATE TABLE IF NOT EXISTS public.instructor_earnings_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_user_id uuid NOT NULL,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('course_revenue_split','cohort_session','bonus','adjustment')),
  source_id uuid,
  amount_credits numeric(12,1) NOT NULL,
  period_month date NOT NULL,
  status text NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued','available','paid','void')),
  payout_request_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_iel_user_status ON public.instructor_earnings_ledger(instructor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_iel_period ON public.instructor_earnings_ledger(instructor_user_id, period_month);
CREATE INDEX IF NOT EXISTS idx_iel_payout ON public.instructor_earnings_ledger(payout_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_iel_source ON public.instructor_earnings_ledger(source_kind, source_id);

ALTER TABLE public.instructor_earnings_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iel_self_select" ON public.instructor_earnings_ledger FOR SELECT TO authenticated USING (instructor_user_id = auth.uid());
CREATE POLICY "iel_admin_all" ON public.instructor_earnings_ledger FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_iel_updated_at BEFORE UPDATE ON public.instructor_earnings_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.instructor_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_user_id uuid NOT NULL,
  talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  amount_credits numeric(12,1) NOT NULL CHECK (amount_credits >= 500),
  payout_method text NOT NULL CHECK (payout_method IN ('bkash','bank','paypal','wise')),
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_notes text,
  fx_rate_bdt numeric(12,4),
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ipr_user ON public.instructor_payout_requests(instructor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ipr_status ON public.instructor_payout_requests(status, created_at DESC);
ALTER TABLE public.instructor_payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipr_self_rw" ON public.instructor_payout_requests FOR SELECT TO authenticated USING (instructor_user_id = auth.uid());
CREATE POLICY "ipr_self_insert" ON public.instructor_payout_requests FOR INSERT TO authenticated WITH CHECK (instructor_user_id = auth.uid());
CREATE POLICY "ipr_admin_all" ON public.instructor_payout_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_ipr_updated_at BEFORE UPDATE ON public.instructor_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.instructor_earnings_ledger
  ADD CONSTRAINT iel_payout_fk FOREIGN KEY (payout_request_id)
  REFERENCES public.instructor_payout_requests(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.instructor_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_user_id uuid NOT NULL,
  period_month date NOT NULL,
  pdf_path text,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instructor_user_id, period_month)
);
ALTER TABLE public.instructor_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "isr_self" ON public.instructor_statements FOR SELECT TO authenticated USING (instructor_user_id = auth.uid());
CREATE POLICY "isr_admin" ON public.instructor_statements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('instructor-statements','instructor-statements', false)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY "instructor_statements_self_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'instructor-statements' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "instructor_statements_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'instructor-statements' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)))
  WITH CHECK (bucket_id = 'instructor-statements' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)));

CREATE OR REPLACE FUNCTION public.trg_split_to_ledger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_talent uuid; v_credits numeric(12,1);
BEGIN
  IF NEW.instructor_amount IS NULL OR NEW.instructor_amount <= 0 THEN RETURN NEW; END IF;
  v_credits := ROUND((NEW.instructor_amount / 2.0)::numeric, 1);
  SELECT id INTO v_talent FROM public.talents WHERE user_id = NEW.instructor_user_id LIMIT 1;
  INSERT INTO public.instructor_earnings_ledger (
    instructor_user_id, talent_id, source_kind, source_id,
    amount_credits, period_month, status
  ) VALUES (
    NEW.instructor_user_id, v_talent, 'course_revenue_split', NEW.id, v_credits,
    date_trunc('month', NEW.created_at)::date,
    CASE WHEN NEW.status IN ('available','paid') THEN 'available' ELSE 'accrued' END
  ) ON CONFLICT (source_kind, source_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_split_to_ledger ON public.course_revenue_splits;
CREATE TRIGGER trg_split_to_ledger AFTER INSERT ON public.course_revenue_splits
  FOR EACH ROW EXECUTE FUNCTION public.trg_split_to_ledger();

INSERT INTO public.instructor_earnings_ledger (
  instructor_user_id, talent_id, source_kind, source_id, amount_credits, period_month, status
)
SELECT s.instructor_user_id,
  (SELECT id FROM public.talents WHERE user_id = s.instructor_user_id LIMIT 1),
  'course_revenue_split', s.id,
  ROUND((s.instructor_amount / 2.0)::numeric, 1),
  date_trunc('month', s.created_at)::date,
  CASE WHEN s.status IN ('available','paid') THEN 'available' ELSE 'accrued' END
FROM public.course_revenue_splits s
WHERE s.instructor_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.instructor_earnings_ledger l
    WHERE l.source_kind='course_revenue_split' AND l.source_id = s.id
  );

INSERT INTO public.instructor_earnings_ledger (
  instructor_user_id, instructor_id, source_kind, source_id, amount_credits, period_month, status
)
SELECT u.id, cs.instructor_id, 'cohort_session', cs.id,
  public.instructor_session_rate_credits(),
  date_trunc('month', cs.scheduled_date)::date, 'available'
FROM public.course_sessions cs
JOIN public.instructors i ON i.id = cs.instructor_id
JOIN auth.users u ON lower(u.email) = lower(i.email)
WHERE cs.status::text = 'completed' AND cs.cohort_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.instructor_earnings_ledger l
    WHERE l.source_kind='cohort_session' AND l.source_id = cs.id
  );

CREATE OR REPLACE FUNCTION public.get_instructor_earnings_summary(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := _user_id;
  v_lifetime numeric := 0; v_month numeric := 0;
  v_available numeric := 0; v_pending numeric := 0;
  v_series jsonb; v_recent jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error','no_user'); END IF;
  IF v_user <> auth.uid() AND NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)) THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  SELECT COALESCE(SUM(amount_credits),0) INTO v_lifetime
    FROM instructor_earnings_ledger WHERE instructor_user_id = v_user AND status <> 'void';
  SELECT COALESCE(SUM(amount_credits),0) INTO v_month
    FROM instructor_earnings_ledger WHERE instructor_user_id = v_user AND status <> 'void'
      AND period_month = date_trunc('month', now())::date;
  SELECT COALESCE(SUM(amount_credits),0) INTO v_available
    FROM instructor_earnings_ledger WHERE instructor_user_id = v_user AND status = 'available' AND payout_request_id IS NULL;
  SELECT COALESCE(SUM(amount_credits),0) INTO v_pending
    FROM instructor_earnings_ledger WHERE instructor_user_id = v_user
      AND (status = 'accrued' OR (status = 'available' AND payout_request_id IS NOT NULL));

  SELECT jsonb_agg(row_to_json(t)) INTO v_series FROM (
    SELECT to_char(period_month,'YYYY-MM') AS month,
           SUM(amount_credits) FILTER (WHERE status <> 'void') AS credits
    FROM instructor_earnings_ledger
    WHERE instructor_user_id = v_user
      AND period_month >= date_trunc('month', now() - interval '5 months')::date
    GROUP BY period_month ORDER BY period_month
  ) t;

  SELECT jsonb_agg(row_to_json(r)) INTO v_recent FROM (
    SELECT id, source_kind, amount_credits, status, period_month, created_at
    FROM instructor_earnings_ledger
    WHERE instructor_user_id = v_user
    ORDER BY created_at DESC LIMIT 20
  ) r;

  RETURN jsonb_build_object(
    'user_id', v_user,
    'lifetime_credits', v_lifetime,
    'this_month_credits', v_month,
    'available_credits', v_available,
    'pending_credits', v_pending,
    'series', COALESCE(v_series,'[]'::jsonb),
    'recent', COALESCE(v_recent,'[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.request_instructor_payout(
  _amount numeric, _method text, _details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid(); v_talent uuid; v_avail numeric; v_req uuid; v_remaining numeric; r record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _amount < 500 THEN RAISE EXCEPTION 'minimum 500 credits'; END IF;
  IF _method NOT IN ('bkash','bank','paypal','wise') THEN RAISE EXCEPTION 'invalid method'; END IF;
  SELECT id INTO v_talent FROM talents WHERE user_id = v_user LIMIT 1;
  SELECT COALESCE(SUM(amount_credits),0) INTO v_avail
    FROM instructor_earnings_ledger
    WHERE instructor_user_id = v_user AND status = 'available' AND payout_request_id IS NULL;
  IF v_avail < _amount THEN RAISE EXCEPTION 'insufficient available balance: % < %', v_avail, _amount; END IF;
  INSERT INTO instructor_payout_requests (instructor_user_id, talent_id, amount_credits, payout_method, payout_details)
    VALUES (v_user, v_talent, _amount, _method, COALESCE(_details,'{}'::jsonb)) RETURNING id INTO v_req;
  v_remaining := _amount;
  FOR r IN SELECT id, amount_credits FROM instructor_earnings_ledger
    WHERE instructor_user_id = v_user AND status = 'available' AND payout_request_id IS NULL
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    UPDATE instructor_earnings_ledger SET payout_request_id = v_req WHERE id = r.id;
    v_remaining := v_remaining - r.amount_credits;
  END LOOP;
  RETURN v_req;
END $$;

CREATE OR REPLACE FUNCTION public.process_instructor_payout(
  _request_id uuid, _action text, _notes text DEFAULT NULL, _fx_rate numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := auth.uid(); v_req record;
BEGIN
  IF NOT (has_role(v_admin,'admin'::app_role) OR has_role(v_admin,'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO v_req FROM instructor_payout_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF _action = 'approve' THEN
    UPDATE instructor_payout_requests SET status='approved', admin_notes=_notes, processed_by=v_admin, processed_at=now() WHERE id=_request_id;
  ELSIF _action = 'paid' THEN
    UPDATE instructor_payout_requests SET status='paid', admin_notes=_notes, processed_by=v_admin, processed_at=now(), fx_rate_bdt=_fx_rate WHERE id=_request_id;
    UPDATE instructor_earnings_ledger SET status='paid' WHERE payout_request_id=_request_id;
  ELSIF _action = 'reject' THEN
    UPDATE instructor_payout_requests SET status='rejected', admin_notes=_notes, processed_by=v_admin, processed_at=now() WHERE id=_request_id;
    UPDATE instructor_earnings_ledger SET payout_request_id=NULL WHERE payout_request_id=_request_id;
  ELSE
    RAISE EXCEPTION 'invalid action';
  END IF;
  RETURN jsonb_build_object('ok', true, 'request_id', _request_id, 'action', _action);
END $$;

GRANT EXECUTE ON FUNCTION public.get_instructor_earnings_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_instructor_payout(numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_instructor_payout(uuid, text, text, numeric) TO authenticated;
