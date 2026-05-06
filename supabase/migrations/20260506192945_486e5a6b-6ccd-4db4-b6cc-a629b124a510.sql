
-- ============================================================================
-- Phase 3.7 — Interviews, Offers, Direct Messaging, Invitations
-- ============================================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.interview_mode AS ENUM ('video','phone','onsite');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_status AS ENUM ('proposed','confirmed','rescheduled','completed','no_show','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('draft','sent','accepted','declined','countered','expired','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','declined','expired','revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- INTERVIEWS ----------
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  talent_id uuid NOT NULL,
  mode public.interview_mode NOT NULL DEFAULT 'video',
  meeting_link text,
  location text,
  note text,
  status public.interview_status NOT NULL DEFAULT 'proposed',
  selected_slot_id uuid,
  duration_min int NOT NULL DEFAULT 30,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interviews_app ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_company ON public.interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interviews_talent ON public.interviews(talent_id);

CREATE TABLE IF NOT EXISTS public.interview_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 30,
  proposed_by_role text NOT NULL DEFAULT 'recruiter',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interview_slots_interview ON public.interview_slots(interview_id);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;

-- helper
CREATE OR REPLACE FUNCTION public.interview_company_id(p_interview_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.interviews WHERE id = p_interview_id;
$$;

CREATE OR REPLACE FUNCTION public.interview_talent_id(p_interview_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT talent_id FROM public.interviews WHERE id = p_interview_id;
$$;

CREATE POLICY "interviews_select" ON public.interviews FOR SELECT
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "interviews_insert" ON public.interviews FOR INSERT
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "interviews_update" ON public.interviews FOR UPDATE
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "interviews_delete" ON public.interviews FOR DELETE
USING (public.is_company_member(auth.uid(), company_id) OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "slots_select" ON public.interview_slots FOR SELECT
USING (
  public.is_company_member(auth.uid(), public.interview_company_id(interview_id))
  OR public.interview_talent_id(interview_id) = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "slots_insert" ON public.interview_slots FOR INSERT
WITH CHECK (
  public.is_company_member(auth.uid(), public.interview_company_id(interview_id))
  OR public.interview_talent_id(interview_id) = auth.uid()
);
CREATE POLICY "slots_delete" ON public.interview_slots FOR DELETE
USING (public.is_company_member(auth.uid(), public.interview_company_id(interview_id)));

-- ---------- OFFERS ----------
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  talent_id uuid NOT NULL,
  title text NOT NULL,
  start_date date,
  currency text NOT NULL DEFAULT 'USD',
  base_amount numeric(14,2) NOT NULL DEFAULT 0,
  variable_amount numeric(14,2),
  equity_note text,
  benefits text,
  custom_note text,
  expires_at timestamptz,
  pdf_path text,
  status public.offer_status NOT NULL DEFAULT 'draft',
  signed_name text,
  signed_at timestamptz,
  decision_note text,
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offers_app ON public.offers(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_company ON public.offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_talent ON public.offers(talent_id);

CREATE TABLE IF NOT EXISTS public.offer_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  version int NOT NULL,
  payload jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offer_versions_offer ON public.offer_versions(offer_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_versions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.offer_company_id(p_offer_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.offers WHERE id = p_offer_id;
$$;
CREATE OR REPLACE FUNCTION public.offer_talent_id(p_offer_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT talent_id FROM public.offers WHERE id = p_offer_id;
$$;

CREATE POLICY "offers_select" ON public.offers FOR SELECT
USING (
  public.is_company_member(auth.uid(), company_id)
  OR (talent_id = auth.uid() AND status <> 'draft')
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "offers_insert" ON public.offers FOR INSERT
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "offers_update" ON public.offers FOR UPDATE
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "offers_delete" ON public.offers FOR DELETE
USING (public.is_company_member(auth.uid(), company_id) AND status = 'draft');

CREATE POLICY "offer_versions_select" ON public.offer_versions FOR SELECT
USING (
  public.is_company_member(auth.uid(), public.offer_company_id(offer_id))
  OR public.offer_talent_id(offer_id) = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "offer_versions_insert" ON public.offer_versions FOR INSERT
WITH CHECK (public.is_company_member(auth.uid(), public.offer_company_id(offer_id)));

-- ---------- DIRECT MESSAGE THREADS ----------
CREATE TABLE IF NOT EXISTS public.direct_message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  talent_id uuid NOT NULL,
  relationship_id uuid,
  subject text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_dmt_company ON public.direct_message_threads(company_id);
CREATE INDEX IF NOT EXISTS idx_dmt_talent ON public.direct_message_threads(talent_id);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.direct_message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('talent','recruiter','admin')),
  body text NOT NULL,
  attachments jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dm_thread ON public.direct_messages(thread_id);

ALTER TABLE public.direct_message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.dm_thread_company_id(p_thread_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.direct_message_threads WHERE id = p_thread_id;
$$;
CREATE OR REPLACE FUNCTION public.dm_thread_talent_id(p_thread_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT talent_id FROM public.direct_message_threads WHERE id = p_thread_id;
$$;

CREATE POLICY "dmt_select" ON public.direct_message_threads FOR SELECT
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "dmt_insert" ON public.direct_message_threads FOR INSERT
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "dmt_update" ON public.direct_message_threads FOR UPDATE
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
);

CREATE POLICY "dm_select" ON public.direct_messages FOR SELECT
USING (
  public.is_company_member(auth.uid(), public.dm_thread_company_id(thread_id))
  OR public.dm_thread_talent_id(thread_id) = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "dm_insert" ON public.direct_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    public.is_company_member(auth.uid(), public.dm_thread_company_id(thread_id))
    OR public.dm_thread_talent_id(thread_id) = auth.uid()
  )
);
CREATE POLICY "dm_update" ON public.direct_messages FOR UPDATE
USING (
  public.is_company_member(auth.uid(), public.dm_thread_company_id(thread_id))
  OR public.dm_thread_talent_id(thread_id) = auth.uid()
);

-- ---------- JOB INVITATIONS ----------
CREATE TABLE IF NOT EXISTS public.job_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  talent_id uuid NOT NULL,
  invited_by uuid,
  note text,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, talent_id)
);
CREATE INDEX IF NOT EXISTS idx_inv_job ON public.job_invitations(job_id);
CREATE INDEX IF NOT EXISTS idx_inv_talent ON public.job_invitations(talent_id);
CREATE INDEX IF NOT EXISTS idx_inv_company ON public.job_invitations(company_id);

ALTER TABLE public.job_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_select" ON public.job_invitations FOR SELECT
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "inv_insert" ON public.job_invitations FOR INSERT
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "inv_update" ON public.job_invitations FOR UPDATE
USING (
  public.is_company_member(auth.uid(), company_id)
  OR talent_id = auth.uid()
  OR public.has_any_admin_role(auth.uid())
);
CREATE POLICY "inv_delete" ON public.job_invitations FOR DELETE
USING (public.is_company_member(auth.uid(), company_id));

-- ---------- TRIGGERS ----------

-- Bump direct_message_threads.last_message_at on new message
CREATE OR REPLACE FUNCTION public.fn_dm_bump_thread()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.direct_message_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_dm_bump_thread ON public.direct_messages;
CREATE TRIGGER trg_dm_bump_thread AFTER INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.fn_dm_bump_thread();

-- updated_at handlers
CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_interviews_touch ON public.interviews;
CREATE TRIGGER trg_interviews_touch BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_offers_touch ON public.offers;
CREATE TRIGGER trg_offers_touch BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- Offer accepted -> auto-move app to hired
CREATE OR REPLACE FUNCTION public.fn_offer_accepted_to_hired()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    UPDATE public.job_applications
    SET application_status = 'hired', last_status_at = now()
    WHERE id = NEW.application_id
      AND application_status NOT IN ('hired','rejected','withdrawn');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_offer_accepted_hired ON public.offers;
CREATE TRIGGER trg_offer_accepted_hired AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.fn_offer_accepted_to_hired();

-- Job application created -> mark matching pending invitation accepted + sourced
CREATE OR REPLACE FUNCTION public.fn_app_link_invitation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv uuid;
BEGIN
  SELECT id INTO v_inv FROM public.job_invitations
  WHERE job_id = NEW.job_id AND talent_id = NEW.talent_id AND status = 'pending'
  LIMIT 1;
  IF v_inv IS NOT NULL THEN
    UPDATE public.job_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = v_inv;
    NEW.sourced := true;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_app_link_invitation ON public.job_applications;
CREATE TRIGGER trg_app_link_invitation BEFORE INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.fn_app_link_invitation();

-- ---------- RPCs ----------

CREATE OR REPLACE FUNCTION public.get_application_hire_state(p_application_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
        v_company_id uuid;
        v_talent_id uuid;
        v_iv jsonb;
        v_off jsonb;
BEGIN
  SELECT j.company_id, ja.talent_id
    INTO v_company_id, v_talent_id
  FROM public.job_applications ja JOIN public.jobs j ON j.id = ja.job_id
  WHERE ja.id = p_application_id;

  IF NOT (public.is_company_member(v_uid, v_company_id) OR v_talent_id = v_uid OR public.has_any_admin_role(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT to_jsonb(i.*) || jsonb_build_object(
    'slots', COALESCE((SELECT jsonb_agg(to_jsonb(s.*) ORDER BY s.starts_at)
                       FROM public.interview_slots s WHERE s.interview_id = i.id), '[]'::jsonb)
  ) INTO v_iv
  FROM public.interviews i
  WHERE i.application_id = p_application_id
  ORDER BY i.created_at DESC LIMIT 1;

  SELECT to_jsonb(o.*) INTO v_off
  FROM public.offers o
  WHERE o.application_id = p_application_id
  ORDER BY o.created_at DESC LIMIT 1;

  RETURN jsonb_build_object('interview', v_iv, 'offer', v_off);
END $$;

CREATE OR REPLACE FUNCTION public.get_hiring_stats(p_company_id uuid, p_window_days int DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
        v_since timestamptz := now() - make_interval(days => p_window_days);
        v_iv_sched int; v_iv_done int; v_iv_no int;
        v_off_sent int; v_off_acc int; v_off_dec int;
        v_avg_ttf numeric;
BEGIN
  IF v_uid IS NULL OR (NOT public.is_company_member(v_uid, p_company_id) AND NOT public.has_any_admin_role(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status IN ('proposed','confirmed','rescheduled')),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show')
  INTO v_iv_sched, v_iv_done, v_iv_no
  FROM public.interviews WHERE company_id = p_company_id AND created_at >= v_since;

  SELECT
    COUNT(*) FILTER (WHERE status = 'sent'),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'declined')
  INTO v_off_sent, v_off_acc, v_off_dec
  FROM public.offers WHERE company_id = p_company_id AND created_at >= v_since;

  SELECT AVG(EXTRACT(EPOCH FROM (o.created_at - ja.created_at))/86400.0)
  INTO v_avg_ttf
  FROM public.offers o JOIN public.job_applications ja ON ja.id = o.application_id
  WHERE o.company_id = p_company_id AND o.status IN ('sent','accepted') AND o.created_at >= v_since;

  RETURN jsonb_build_object(
    'interviews_scheduled', COALESCE(v_iv_sched,0),
    'interviews_completed', COALESCE(v_iv_done,0),
    'interviews_no_show', COALESCE(v_iv_no,0),
    'offers_sent', COALESCE(v_off_sent,0),
    'offers_accepted', COALESCE(v_off_acc,0),
    'offers_declined', COALESCE(v_off_dec,0),
    'avg_time_to_offer_days', ROUND(COALESCE(v_avg_ttf,0)::numeric, 1)
  );
END $$;

CREATE OR REPLACE FUNCTION public.confirm_interview_slot(p_interview_id uuid, p_slot_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
        v_company uuid; v_talent uuid;
BEGIN
  SELECT company_id, talent_id INTO v_company, v_talent FROM public.interviews WHERE id = p_interview_id;
  IF NOT (public.is_company_member(v_uid, v_company) OR v_talent = v_uid OR public.has_any_admin_role(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.interviews
  SET selected_slot_id = p_slot_id, status = 'confirmed', updated_at = now()
  WHERE id = p_interview_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid, p_signed_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
        v_talent uuid;
BEGIN
  SELECT talent_id INTO v_talent FROM public.offers WHERE id = p_offer_id;
  IF v_talent <> v_uid THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_signed_name IS NULL OR length(trim(p_signed_name)) < 2 THEN
    RAISE EXCEPTION 'signature_required';
  END IF;
  UPDATE public.offers
  SET status = 'accepted', signed_name = p_signed_name, signed_at = now()
  WHERE id = p_offer_id AND status = 'sent';
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.decline_offer(p_offer_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
        v_talent uuid;
BEGIN
  SELECT talent_id INTO v_talent FROM public.offers WHERE id = p_offer_id;
  IF v_talent <> v_uid THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.offers SET status = 'declined', decision_note = p_note WHERE id = p_offer_id AND status = 'sent';
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.upsert_direct_thread(p_company_id uuid, p_talent_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF NOT public.is_company_member(v_uid, p_company_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT id INTO v_id FROM public.direct_message_threads
  WHERE company_id = p_company_id AND talent_id = p_talent_id;
  IF v_id IS NULL THEN
    INSERT INTO public.direct_message_threads (company_id, talent_id)
    VALUES (p_company_id, p_talent_id) RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END $$;

-- ---------- STORAGE ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-letters', 'offer-letters', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "offers_read" ON storage.objects FOR SELECT
USING (
  bucket_id = 'offer-letters'
  AND (
    public.has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.pdf_path = name
        AND (public.is_company_member(auth.uid(), o.company_id) OR o.talent_id = auth.uid())
    )
  )
);
CREATE POLICY "offers_write" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'offer-letters'
  AND public.has_any_admin_role(auth.uid())
);
