
-- ============ Feature A: Pipeline ============
ALTER TABLE public.ir_investors
  ADD COLUMN IF NOT EXISTS lead_capability TEXT NOT NULL DEFAULT 'follower',
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'target',
  ADD COLUMN IF NOT EXISTS pipeline_position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS check_size_min_usd NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS check_size_max_usd NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS probability_pct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE,
  ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.ir_investors
    ADD CONSTRAINT ir_investors_lead_capability_chk
    CHECK (lead_capability IN ('lead','co_lead','follower','syndicate','angel'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.ir_investors
    ADD CONSTRAINT ir_investors_pipeline_stage_chk
    CHECK (pipeline_stage IN ('target','warm_intro','first_meeting','partner_pitch','deep_diligence','term_sheet','closed','passed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.ir_investors
    ADD CONSTRAINT ir_investors_probability_chk
    CHECK (probability_pct BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS ir_investors_pipeline_idx
  ON public.ir_investors(pipeline_stage, pipeline_position);

CREATE TABLE IF NOT EXISTS public.ir_pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES public.ir_investors(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ir_pipeline_events_investor_idx
  ON public.ir_pipeline_events(investor_id, created_at DESC);

ALTER TABLE public.ir_pipeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage pipeline events" ON public.ir_pipeline_events;
CREATE POLICY "Admins manage pipeline events"
  ON public.ir_pipeline_events FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.ir_log_pipeline_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.ir_pipeline_events(investor_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.pipeline_stage, NEW.pipeline_stage, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ir_investors_stage_change ON public.ir_investors;
CREATE TRIGGER trg_ir_investors_stage_change
BEFORE UPDATE OF pipeline_stage ON public.ir_investors
FOR EACH ROW EXECUTE FUNCTION public.ir_log_pipeline_stage_change();

-- ============ Feature B: Data Room ============
CREATE TABLE IF NOT EXISTS public.ir_data_room_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('pitch_deck','memo','financials','demo_video','data_room_link','other')),
  file_url TEXT,
  external_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  total_slides INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ir_data_room_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.ir_data_room_documents(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.ir_investors(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  expires_at TIMESTAMPTZ,
  require_email BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ir_share_links_document_idx ON public.ir_data_room_share_links(document_id);
CREATE INDEX IF NOT EXISTS ir_share_links_investor_idx ON public.ir_data_room_share_links(investor_id);

CREATE TABLE IF NOT EXISTS public.ir_document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID REFERENCES public.ir_data_room_share_links(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.ir_data_room_documents(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.ir_investors(id) ON DELETE SET NULL,
  viewer_email TEXT,
  viewer_ip INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ir_document_views_document_idx ON public.ir_document_views(document_id);
CREATE INDEX IF NOT EXISTS ir_document_views_investor_idx ON public.ir_document_views(investor_id);

CREATE TABLE IF NOT EXISTS public.ir_document_slide_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id UUID NOT NULL REFERENCES public.ir_document_views(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  slide_label TEXT,
  dwell_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ir_slide_events_view_idx ON public.ir_document_slide_events(view_id);

CREATE OR REPLACE VIEW public.ir_document_hot_slides AS
SELECT v.document_id,
       v.investor_id,
       e.slide_number,
       e.slide_label,
       SUM(e.dwell_seconds) AS total_dwell,
       MAX(e.created_at) AS last_seen
FROM public.ir_document_slide_events e
JOIN public.ir_document_views v ON v.id = e.view_id
GROUP BY v.document_id, v.investor_id, e.slide_number, e.slide_label
HAVING SUM(e.dwell_seconds) >= 300;

ALTER TABLE public.ir_data_room_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_data_room_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir_document_slide_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage data room documents" ON public.ir_data_room_documents;
CREATE POLICY "Admins manage data room documents"
  ON public.ir_data_room_documents FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage share links" ON public.ir_data_room_share_links;
CREATE POLICY "Admins manage share links"
  ON public.ir_data_room_share_links FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins read document views" ON public.ir_document_views;
CREATE POLICY "Admins read document views"
  ON public.ir_document_views FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins read slide events" ON public.ir_document_slide_events;
CREATE POLICY "Admins read slide events"
  ON public.ir_document_slide_events FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('ir-data-room', 'ir-data-room', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins read ir-data-room" ON storage.objects;
CREATE POLICY "Admins read ir-data-room"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ir-data-room' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins write ir-data-room" ON storage.objects;
CREATE POLICY "Admins write ir-data-room"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ir-data-room' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins update ir-data-room" ON storage.objects;
CREATE POLICY "Admins update ir-data-room"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ir-data-room' AND public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins delete ir-data-room" ON storage.objects;
CREATE POLICY "Admins delete ir-data-room"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ir-data-room' AND public.has_role(auth.uid(),'admin'));

-- ============ Feature C: AI-Era Unit Economics ============
ALTER TABLE public.ir_metrics_snapshots
  ADD COLUMN IF NOT EXISTS active_users_dau INTEGER,
  ADD COLUMN IF NOT EXISTS active_users_wau INTEGER,
  ADD COLUMN IF NOT EXISTS active_users_mau INTEGER,
  ADD COLUMN IF NOT EXISTS gross_revenue_retention_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS net_revenue_retention_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS usage_retention_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS ai_inference_cogs_usd NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS hitl_labor_cogs_usd NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS automated_actions_count INTEGER,
  ADD COLUMN IF NOT EXISTS hitl_actions_count INTEGER,
  ADD COLUMN IF NOT EXISTS headcount_fte NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS contractor_fte NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS revenue_per_employee_usd NUMERIC(12,2);

CREATE TABLE IF NOT EXISTS public.ir_retention_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL,
  period_index INTEGER NOT NULL,
  cohort_size INTEGER NOT NULL,
  active_users INTEGER NOT NULL,
  retained_revenue_usd NUMERIC(12,2),
  expansion_revenue_usd NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_month, period_index)
);

ALTER TABLE public.ir_retention_cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage retention cohorts" ON public.ir_retention_cohorts;
CREATE POLICY "Admins manage retention cohorts"
  ON public.ir_retention_cohorts FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
