
CREATE TYPE public.cohort_status AS ENUM ('planning','open','in_progress','completed','archived');
CREATE TYPE public.session_kind AS ENUM ('lecture','office_hours','review','exam','orientation','workshop');
CREATE TYPE public.attendance_status AS ENUM ('attended','partial','absent','excused');
CREATE TYPE public.attendance_source AS ENUM ('auto','self','instructor','system');

CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  starts_on DATE,
  ends_on DATE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  capacity INTEGER,
  status public.cohort_status NOT NULL DEFAULT 'planning',
  is_self_paced BOOLEAN NOT NULL DEFAULT false,
  instructor_engagement_id UUID,
  brief_id UUID,
  attendance_threshold_pct INTEGER NOT NULL DEFAULT 50,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cohorts_content ON public.cohorts(content_id);
CREATE INDEX idx_cohorts_status ON public.cohorts(status);
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cohorts" ON public.cohorts
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Anyone can view open cohorts" ON public.cohorts
  FOR SELECT USING (status IN ('open','in_progress','completed'));
CREATE TRIGGER trg_cohorts_updated BEFORE UPDATE ON public.cohorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cohort_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cohort_id, enrollment_id)
);
CREATE INDEX idx_ce_user ON public.cohort_enrollments(user_id);
CREATE INDEX idx_ce_cohort ON public.cohort_enrollments(cohort_id);
ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User views own cohort enrollment" ON public.cohort_enrollments
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin manages cohort enrollments" ON public.cohort_enrollments
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.cohorts (content_id, name, status, is_self_paced)
SELECT c.id, 'Self-paced', 'in_progress', true
FROM public.content c
WHERE NOT EXISTS (
  SELECT 1 FROM public.cohorts k WHERE k.content_id = c.id AND k.is_self_paced = true
);

INSERT INTO public.cohort_enrollments (cohort_id, enrollment_id, user_id)
SELECT k.id, e.id, s.user_id
FROM public.enrollments e
JOIN public.students s ON s.id = e.student_id
JOIN public.cohorts k ON k.content_id = e.content_id AND k.is_self_paced = true
WHERE s.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.course_sessions
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_timezone TEXT DEFAULT 'Asia/Dhaka',
  ADD COLUMN IF NOT EXISTS kind public.session_kind NOT NULL DEFAULT 'lecture',
  ADD COLUMN IF NOT EXISTS module_id UUID,
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attendance_threshold_pct INTEGER;

CREATE INDEX IF NOT EXISTS idx_cs_cohort ON public.course_sessions(cohort_id);

CREATE TABLE public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'absent',
  source public.attendance_source NOT NULL DEFAULT 'auto',
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);
CREATE INDEX idx_sa_session ON public.session_attendance(session_id);
CREATE INDEX idx_sa_user ON public.session_attendance(user_id);
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User views own attendance" ON public.session_attendance
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "User self-marks attendance" ON public.session_attendance
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User updates own attendance" ON public.session_attendance
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manages attendance" ON public.session_attendance
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_sa_updated BEFORE UPDATE ON public.session_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notification_dispatch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  scope_id UUID NOT NULL,
  kind TEXT NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB,
  UNIQUE(scope, scope_id, kind)
);
ALTER TABLE public.notification_dispatch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads dispatch" ON public.notification_dispatch
  FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.cohort_health(_cohort_id UUID)
RETURNS TABLE(
  cohort_id UUID, enrollment_count BIGINT, session_count BIGINT,
  upcoming_sessions BIGINT, attendance_rate NUMERIC, capacity INTEGER
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    k.id,
    (SELECT count(*) FROM cohort_enrollments WHERE cohort_id = k.id),
    (SELECT count(*) FROM course_sessions WHERE cohort_id = k.id),
    (SELECT count(*) FROM course_sessions WHERE cohort_id = k.id AND scheduled_date > now()),
    COALESCE((
      SELECT round(100.0 * avg(case when sa.status IN ('attended','partial') then 1 else 0 end), 1)
      FROM course_sessions cs
      LEFT JOIN session_attendance sa ON sa.session_id = cs.id
      WHERE cs.cohort_id = k.id AND cs.status = 'completed'
    ), 0),
    k.capacity
  FROM cohorts k WHERE k.id = _cohort_id;
$$;

CREATE OR REPLACE FUNCTION public.mark_session_attendance(_session_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  INSERT INTO session_attendance (session_id, user_id, status, source, joined_at)
  VALUES (_session_id, v_user, 'attended', 'self', now())
  ON CONFLICT (session_id, user_id) DO UPDATE
    SET status = CASE WHEN session_attendance.status = 'absent' THEN 'attended' ELSE session_attendance.status END,
        joined_at = COALESCE(session_attendance.joined_at, now()),
        updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.instructor_session_attendance(_session_id UUID)
RETURNS TABLE(
  user_id UUID, display_name TEXT, email TEXT,
  status public.attendance_status, source public.attendance_source,
  joined_at TIMESTAMPTZ, duration_seconds INTEGER
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH cs AS (SELECT cohort_id, content_id FROM course_sessions WHERE id = _session_id),
  enrolled AS (
    SELECT DISTINCT ce.user_id FROM cs LEFT JOIN cohort_enrollments ce ON ce.cohort_id = cs.cohort_id WHERE ce.user_id IS NOT NULL
    UNION
    SELECT s.user_id FROM cs JOIN enrollments e ON e.content_id = cs.content_id JOIN students s ON s.id = e.student_id WHERE s.user_id IS NOT NULL
  )
  SELECT
    en.user_id,
    COALESCE(t.full_name, ''),
    COALESCE(t.email, ''),
    COALESCE(sa.status, 'absent'::attendance_status),
    COALESCE(sa.source, 'system'::attendance_source),
    sa.joined_at,
    COALESCE(sa.duration_seconds, 0)
  FROM enrolled en
  LEFT JOIN session_attendance sa ON sa.session_id = _session_id AND sa.user_id = en.user_id
  LEFT JOIN talents t ON t.user_id = en.user_id
  WHERE has_role(auth.uid(),'admin'::app_role)
     OR EXISTS (
       SELECT 1 FROM course_sessions cs2
       JOIN course_engagements ceg ON ceg.content_id = cs2.content_id
       WHERE cs2.id = _session_id AND ceg.user_id = auth.uid()
     );
$$;

CREATE OR REPLACE FUNCTION public.upcoming_sessions_for_user(_user_id UUID, _limit INT DEFAULT 10)
RETURNS TABLE(
  session_id UUID, cohort_id UUID, content_id UUID, title TEXT,
  scheduled_date TIMESTAMPTZ, duration_minutes INTEGER, meeting_link TEXT,
  kind public.session_kind, status public.session_status, course_title TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cs.id, cs.cohort_id, cs.content_id, cs.title, cs.scheduled_date,
         cs.duration_minutes, cs.meeting_link, cs.kind, cs.status, c.title
  FROM course_sessions cs JOIN content c ON c.id = cs.content_id
  WHERE cs.scheduled_date > now() - interval '30 minutes'
    AND (
      EXISTS (SELECT 1 FROM cohort_enrollments ce WHERE ce.cohort_id = cs.cohort_id AND ce.user_id = _user_id)
      OR EXISTS (SELECT 1 FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.content_id = cs.content_id AND s.user_id = _user_id)
    )
  ORDER BY cs.scheduled_date ASC LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_session_recording()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.recording_link IS NOT NULL
     AND (OLD.recording_link IS DISTINCT FROM NEW.recording_link OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO notification_dispatch (scope, scope_id, kind, payload)
    VALUES ('session', NEW.id, 'recording_ready', jsonb_build_object('recording_link', NEW.recording_link))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_session_recording ON public.course_sessions;
CREATE TRIGGER trg_session_recording AFTER UPDATE ON public.course_sessions
FOR EACH ROW EXECUTE FUNCTION public.dispatch_session_recording();
