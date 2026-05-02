-- Threads
CREATE TABLE public.admin_analyst_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New analysis',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_analyst_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage analyst threads"
ON public.admin_analyst_threads FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_admin_analyst_threads_updated
BEFORE UPDATE ON public.admin_analyst_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.admin_analyst_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.admin_analyst_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text,
  tool_calls jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_analyst_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_admin_analyst_messages_thread ON public.admin_analyst_messages(thread_id, created_at);
CREATE POLICY "Super admins manage analyst messages"
ON public.admin_analyst_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Reports
CREATE TABLE public.admin_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled report',
  period jsonb NOT NULL DEFAULT '{}'::jsonb,
  spec_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  share_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage reports"
ON public.admin_reports FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER trg_admin_reports_updated
BEFORE UPDATE ON public.admin_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Whitelisted analytics RPCs
CREATE OR REPLACE FUNCTION public.analyst_metric(metric text, period jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ts_from timestamptz := COALESCE((period->>'from')::timestamptz, '1970-01-01'::timestamptz);
  ts_to   timestamptz := COALESCE((period->>'to')::timestamptz, now());
  n numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  CASE metric
    WHEN 'talents_count' THEN SELECT count(*) INTO n FROM talents WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'transactions_count' THEN SELECT count(*) INTO n FROM credit_transactions WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'transactions_revenue_bdt' THEN SELECT COALESCE(SUM(amount_bdt),0) INTO n FROM credit_transactions WHERE created_at BETWEEN ts_from AND ts_to AND status='completed';
    WHEN 'jobs_count' THEN SELECT count(*) INTO n FROM jobs WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'job_applications_count' THEN SELECT count(*) INTO n FROM job_applications WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'companies_count' THEN SELECT count(*) INTO n FROM companies WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'enrollments_count' THEN SELECT count(*) INTO n FROM enrollments WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'agent_sessions_count' THEN SELECT count(*) INTO n FROM ai_agent_sessions WHERE created_at BETWEEN ts_from AND ts_to;
    WHEN 'credits_issued' THEN SELECT COALESCE(SUM(amount),0) INTO n FROM credit_transactions WHERE created_at BETWEEN ts_from AND ts_to AND amount > 0;
    WHEN 'credits_spent' THEN SELECT COALESCE(-SUM(amount),0) INTO n FROM credit_transactions WHERE created_at BETWEEN ts_from AND ts_to AND amount < 0;
    ELSE RAISE EXCEPTION 'unknown metric: %', metric;
  END CASE;
  RETURN jsonb_build_object('metric', metric, 'value', COALESCE(n,0), 'period', jsonb_build_object('from', ts_from, 'to', ts_to));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('metric', metric, 'value', 0, 'error', SQLERRM);
END; $$;

CREATE OR REPLACE FUNCTION public.analyst_top_n(dimension text, metric text, period jsonb DEFAULT '{}'::jsonb, n integer DEFAULT 10)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ts_from timestamptz := COALESCE((period->>'from')::timestamptz, '1970-01-01'::timestamptz);
  ts_to   timestamptz := COALESCE((period->>'to')::timestamptz, now());
  rows jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF dimension = 'country' AND metric = 'talents_count' THEN
    SELECT jsonb_agg(t) INTO rows FROM (SELECT country AS label, count(*) AS value FROM talents WHERE created_at BETWEEN ts_from AND ts_to AND country IS NOT NULL GROUP BY country ORDER BY count(*) DESC LIMIT n) t;
  ELSIF dimension = 'country' AND metric = 'jobs_count' THEN
    SELECT jsonb_agg(t) INTO rows FROM (SELECT country AS label, count(*) AS value FROM jobs WHERE created_at BETWEEN ts_from AND ts_to AND country IS NOT NULL GROUP BY country ORDER BY count(*) DESC LIMIT n) t;
  ELSIF dimension = 'company' AND metric = 'jobs_count' THEN
    SELECT jsonb_agg(t) INTO rows FROM (SELECT c.name AS label, count(j.*) AS value FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.created_at BETWEEN ts_from AND ts_to GROUP BY c.name ORDER BY count(j.*) DESC LIMIT n) t;
  ELSIF dimension = 'service' AND metric = 'transactions_revenue_bdt' THEN
    SELECT jsonb_agg(t) INTO rows FROM (SELECT COALESCE(service,'unknown') AS label, COALESCE(SUM(amount_bdt),0) AS value FROM credit_transactions WHERE created_at BETWEEN ts_from AND ts_to AND status='completed' GROUP BY service ORDER BY SUM(amount_bdt) DESC NULLS LAST LIMIT n) t;
  ELSE RAISE EXCEPTION 'unsupported dimension/metric: %/%', dimension, metric; END IF;
  RETURN jsonb_build_object('dimension', dimension, 'metric', metric, 'rows', COALESCE(rows,'[]'::jsonb));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('dimension', dimension, 'metric', metric, 'rows', '[]'::jsonb, 'error', SQLERRM);
END; $$;

CREATE OR REPLACE FUNCTION public.analyst_series(metric text, period jsonb DEFAULT '{}'::jsonb, granularity text DEFAULT 'day')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ts_from timestamptz := COALESCE((period->>'from')::timestamptz, now() - interval '30 days');
  ts_to   timestamptz := COALESCE((period->>'to')::timestamptz, now());
  bucket  text := CASE WHEN granularity IN ('day','week','month') THEN granularity ELSE 'day' END;
  rows jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF metric = 'talents_count' THEN
    EXECUTE format($f$SELECT jsonb_agg(t) FROM (SELECT date_trunc(%L, created_at) AS bucket, count(*) AS value FROM talents WHERE created_at BETWEEN %L AND %L GROUP BY 1 ORDER BY 1) t$f$, bucket, ts_from, ts_to) INTO rows;
  ELSIF metric = 'transactions_count' THEN
    EXECUTE format($f$SELECT jsonb_agg(t) FROM (SELECT date_trunc(%L, created_at) AS bucket, count(*) AS value FROM credit_transactions WHERE created_at BETWEEN %L AND %L GROUP BY 1 ORDER BY 1) t$f$, bucket, ts_from, ts_to) INTO rows;
  ELSIF metric = 'transactions_revenue_bdt' THEN
    EXECUTE format($f$SELECT jsonb_agg(t) FROM (SELECT date_trunc(%L, created_at) AS bucket, COALESCE(SUM(amount_bdt),0) AS value FROM credit_transactions WHERE created_at BETWEEN %L AND %L AND status='completed' GROUP BY 1 ORDER BY 1) t$f$, bucket, ts_from, ts_to) INTO rows;
  ELSIF metric = 'jobs_count' THEN
    EXECUTE format($f$SELECT jsonb_agg(t) FROM (SELECT date_trunc(%L, created_at) AS bucket, count(*) AS value FROM jobs WHERE created_at BETWEEN %L AND %L GROUP BY 1 ORDER BY 1) t$f$, bucket, ts_from, ts_to) INTO rows;
  ELSE RAISE EXCEPTION 'unsupported series metric: %', metric; END IF;
  RETURN jsonb_build_object('metric', metric, 'granularity', bucket, 'rows', COALESCE(rows,'[]'::jsonb));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('metric', metric, 'rows', '[]'::jsonb, 'error', SQLERRM);
END; $$;