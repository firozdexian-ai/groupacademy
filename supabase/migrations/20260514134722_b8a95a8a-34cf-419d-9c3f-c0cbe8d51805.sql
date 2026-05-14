-- 1. Top countries by talent count
CREATE OR REPLACE FUNCTION public.get_top_countries()
RETURNS TABLE(country text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT country, count(*)::bigint AS count
  FROM public.talents
  WHERE country IS NOT NULL AND btrim(country) <> ''
  GROUP BY country
  ORDER BY count(*) DESC
  LIMIT 5;
$$;

-- 2. Bulk wrapper around analyst_metric: returns one row per (metric, period)
CREATE OR REPLACE FUNCTION public.analyst_metrics_bulk(metrics text[], periods jsonb)
RETURNS TABLE(metric text, period_label text, value numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m text;
  p jsonb;
  result jsonb;
BEGIN
  FOREACH m IN ARRAY metrics LOOP
    FOR p IN SELECT * FROM jsonb_array_elements(periods) LOOP
      result := public.analyst_metric(m, jsonb_build_object('from', p->>'from', 'to', p->>'to'));
      metric := m;
      period_label := COALESCE(p->>'label', '');
      value := COALESCE((result->>'value')::numeric, 0);
      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. Anomaly view derived from platform_events payload
CREATE OR REPLACE VIEW public.vw_agent_anomalies AS
SELECT
  id,
  COALESCE(payload->>'severity', 'info') AS severity,
  COALESCE(payload->>'agent_key', event_kind) AS agent_key,
  COALESCE(payload->>'title', event_kind) AS title,
  COALESCE(payload->>'description', '') AS description,
  event_kind,
  created_at
FROM public.platform_events
WHERE COALESCE(payload->>'severity', 'info') IN ('critical','warning','opportunity');

GRANT SELECT ON public.vw_agent_anomalies TO authenticated;