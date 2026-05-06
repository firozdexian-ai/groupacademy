
-- Phase 3.5: application messages, audit log, status notify trigger, employer pipeline RPC

-- 1. application_messages
CREATE TABLE public.application_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('talent','recruiter','admin')),
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_messages_app ON public.application_messages(application_id, created_at DESC);
CREATE INDEX idx_app_messages_sender ON public.application_messages(sender_id);
ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

-- helper: who owns the application (talent user id) and the company
CREATE OR REPLACE FUNCTION public.application_talent_user_id(p_application_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.user_id
  FROM public.job_applications ja
  LEFT JOIN public.talents t ON t.id = ja.talent_id
  WHERE ja.id = p_application_id
$$;

CREATE OR REPLACE FUNCTION public.application_company_id(p_application_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT j.company_id
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  WHERE ja.id = p_application_id
$$;

CREATE POLICY "Talent reads own application messages"
ON public.application_messages FOR SELECT
USING (auth.uid() = public.application_talent_user_id(application_id));

CREATE POLICY "Recruiter reads company application messages"
ON public.application_messages FOR SELECT
USING (public.is_company_member(auth.uid(), public.application_company_id(application_id)));

CREATE POLICY "Admin reads all application messages"
ON public.application_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent sends own application messages"
ON public.application_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'talent'
  AND auth.uid() = public.application_talent_user_id(application_id)
);

CREATE POLICY "Recruiter sends company application messages"
ON public.application_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'recruiter'
  AND public.is_company_member(auth.uid(), public.application_company_id(application_id))
);

CREATE POLICY "Admin sends application messages"
ON public.application_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'admin'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Sender or recipient updates read_at"
ON public.application_messages FOR UPDATE
USING (
  auth.uid() = public.application_talent_user_id(application_id)
  OR public.is_company_member(auth.uid(), public.application_company_id(application_id))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.application_messages;
ALTER TABLE public.application_messages REPLICA IDENTITY FULL;

-- 2. application_audit_log
CREATE TABLE public.application_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_role text NOT NULL CHECK (actor_role IN ('talent','recruiter','admin','system')),
  from_status public.application_status,
  to_status public.application_status NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_audit_app ON public.application_audit_log(application_id, created_at DESC);
ALTER TABLE public.application_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent reads own application audit"
ON public.application_audit_log FOR SELECT
USING (auth.uid() = public.application_talent_user_id(application_id));

CREATE POLICY "Recruiter reads company application audit"
ON public.application_audit_log FOR SELECT
USING (public.is_company_member(auth.uid(), public.application_company_id(application_id)));

CREATE POLICY "Admin reads all application audit"
ON public.application_audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Status-change trigger: writes audit + dispatches notification
CREATE OR REPLACE FUNCTION public.fn_job_application_status_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_role text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.application_status IS DISTINCT FROM OLD.application_status THEN
    -- Determine actor role
    IF auth.uid() IS NULL THEN
      v_actor_role := 'system';
    ELSIF public.has_role(auth.uid(), 'admin'::app_role) THEN
      v_actor_role := 'admin';
    ELSIF public.is_company_member(auth.uid(), (SELECT company_id FROM public.jobs WHERE id = NEW.job_id)) THEN
      v_actor_role := 'recruiter';
    ELSE
      v_actor_role := 'talent';
    END IF;

    INSERT INTO public.application_audit_log (application_id, actor_id, actor_role, from_status, to_status)
    VALUES (NEW.id, auth.uid(), v_actor_role, OLD.application_status, NEW.application_status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_app_status_audit ON public.job_applications;
CREATE TRIGGER trg_job_app_status_audit
AFTER UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.fn_job_application_status_audit();

-- 4. Recruiter UPDATE policy on job_applications
CREATE POLICY "Recruiters update applications on their jobs"
ON public.job_applications FOR UPDATE
USING (
  public.is_company_member(
    auth.uid(),
    (SELECT company_id FROM public.jobs WHERE id = job_id)
  )
)
WITH CHECK (
  public.is_company_member(
    auth.uid(),
    (SELECT company_id FROM public.jobs WHERE id = job_id)
  )
);

CREATE POLICY "Recruiters view applications on their jobs"
ON public.job_applications FOR SELECT
USING (
  public.is_company_member(
    auth.uid(),
    (SELECT company_id FROM public.jobs WHERE id = job_id)
  )
);

-- 5. Employer pipeline RPC
CREATE OR REPLACE FUNCTION public.get_employer_pipeline(
  p_company_id uuid DEFAULT NULL,
  p_job_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.has_role(v_uid, 'admin'::app_role);
  v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  -- non-admin must scope to a company they manage
  IF NOT v_is_admin THEN
    IF p_company_id IS NULL OR NOT public.is_company_member(v_uid, p_company_id) THEN
      RETURN '{}'::jsonb;
    END IF;
  END IF;

  SELECT jsonb_object_agg(application_status::text, n)
  INTO v_result
  FROM (
    SELECT ja.application_status, COUNT(*)::int AS n
    FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE (p_job_id IS NULL OR ja.job_id = p_job_id)
      AND (p_company_id IS NULL OR j.company_id = p_company_id)
    GROUP BY ja.application_status
  ) s;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- 6. Application thread summary RPC
CREATE OR REPLACE FUNCTION public.get_application_thread_summary(p_application_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_can boolean;
  v_last record;
  v_unread int;
BEGIN
  IF v_uid IS NULL THEN RETURN '{}'::jsonb; END IF;

  v_can := (
    v_uid = public.application_talent_user_id(p_application_id)
    OR public.is_company_member(v_uid, public.application_company_id(p_application_id))
    OR public.has_role(v_uid, 'admin'::app_role)
  );
  IF NOT v_can THEN RETURN '{}'::jsonb; END IF;

  SELECT body, sender_role, created_at INTO v_last
  FROM public.application_messages
  WHERE application_id = p_application_id
  ORDER BY created_at DESC LIMIT 1;

  SELECT COUNT(*) INTO v_unread
  FROM public.application_messages
  WHERE application_id = p_application_id
    AND sender_id <> v_uid
    AND read_at IS NULL;

  RETURN jsonb_build_object(
    'last_body', v_last.body,
    'last_sender_role', v_last.sender_role,
    'last_at', v_last.created_at,
    'unread_count', COALESCE(v_unread, 0)
  );
END;
$$;
