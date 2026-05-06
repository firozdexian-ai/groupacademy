-- ============================================================
-- Phase 4.5 — Company Tracks & Branded Catalog
-- ============================================================

-- 1. learning_tracks
CREATE TABLE IF NOT EXISTS public.learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text,
  cover_url text,
  owner_kind text NOT NULL DEFAULT 'platform' CHECK (owner_kind IN ('platform','company')),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid,
  is_sequential boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  enrollment_credits numeric(12,1) NOT NULL DEFAULT 0,
  b2b_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lt_company ON public.learning_tracks(company_id);
CREATE INDEX IF NOT EXISTS idx_lt_published ON public.learning_tracks(is_published);

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tracks are viewable when published" ON public.learning_tracks;
CREATE POLICY "Tracks are viewable when published" ON public.learning_tracks
  FOR SELECT USING (
    is_published
    OR created_by = auth.uid()
    OR (company_id IS NOT NULL AND is_company_member(auth.uid(), company_id))
    OR has_any_admin_role(auth.uid())
  );

DROP POLICY IF EXISTS "Company admins manage their tracks" ON public.learning_tracks;
CREATE POLICY "Company admins manage their tracks" ON public.learning_tracks
  FOR ALL USING (
    (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id))
    OR has_any_admin_role(auth.uid())
  ) WITH CHECK (
    (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id))
    OR has_any_admin_role(auth.uid())
  );

CREATE TRIGGER trg_learning_tracks_updated
  BEFORE UPDATE ON public.learning_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. learning_track_items
CREATE TABLE IF NOT EXISTS public.learning_track_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, content_id)
);
CREATE INDEX IF NOT EXISTS idx_lti_track ON public.learning_track_items(track_id, position);

ALTER TABLE public.learning_track_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Items follow parent track read" ON public.learning_track_items;
CREATE POLICY "Items follow parent track read" ON public.learning_track_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_id
      AND (t.is_published OR t.created_by = auth.uid()
        OR (t.company_id IS NOT NULL AND is_company_member(auth.uid(), t.company_id))
        OR has_any_admin_role(auth.uid())))
  );

DROP POLICY IF EXISTS "Items follow parent track manage" ON public.learning_track_items;
CREATE POLICY "Items follow parent track manage" ON public.learning_track_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_id
      AND ((t.company_id IS NOT NULL AND is_company_admin(auth.uid(), t.company_id))
        OR has_any_admin_role(auth.uid())))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM learning_tracks t WHERE t.id = track_id
      AND ((t.company_id IS NOT NULL AND is_company_admin(auth.uid(), t.company_id))
        OR has_any_admin_role(auth.uid())))
  );

-- 3. learning_track_assignments
DO $$ BEGIN
  CREATE TYPE track_assignment_status AS ENUM ('invited','active','completed','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.learning_track_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  talent_id uuid,
  assigned_by uuid,
  org_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status track_assignment_status NOT NULL DEFAULT 'active',
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lta_user ON public.learning_track_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lta_org ON public.learning_track_assignments(org_id, status);

ALTER TABLE public.learning_track_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talent reads own assignments" ON public.learning_track_assignments;
CREATE POLICY "Talent reads own assignments" ON public.learning_track_assignments
  FOR SELECT USING (
    user_id = auth.uid()
    OR (org_id IS NOT NULL AND is_company_member(auth.uid(), org_id))
    OR has_any_admin_role(auth.uid())
  );

DROP POLICY IF EXISTS "Org admins manage assignments" ON public.learning_track_assignments;
CREATE POLICY "Org admins manage assignments" ON public.learning_track_assignments
  FOR ALL USING (
    (org_id IS NOT NULL AND is_company_admin(auth.uid(), org_id))
    OR has_any_admin_role(auth.uid())
  ) WITH CHECK (
    (org_id IS NOT NULL AND is_company_admin(auth.uid(), org_id))
    OR has_any_admin_role(auth.uid())
  );

CREATE TRIGGER trg_lta_updated
  BEFORE UPDATE ON public.learning_track_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. certificates extension
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS track_assignment_id uuid REFERENCES public.learning_track_assignments(id) ON DELETE SET NULL;

-- Existing UNIQUE on enrollment_id breaks track certificates. Make track certs nullable on enrollment_id.
ALTER TABLE public.certificates ALTER COLUMN enrollment_id DROP NOT NULL;

-- 5. RPC: org_assign_track
CREATE OR REPLACE FUNCTION public.org_assign_track(
  p_track_id uuid,
  p_company_id uuid,
  p_user_ids uuid[],
  p_due_at timestamptz DEFAULT NULL
)
RETURNS TABLE(assignment_id uuid, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_assign_id uuid;
  v_talent_id uuid;
  r record;
BEGIN
  IF NOT (is_company_admin(auth.uid(), p_company_id) OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOREACH v_uid IN ARRAY p_user_ids LOOP
    SELECT id INTO v_talent_id FROM talents WHERE talents.user_id = v_uid LIMIT 1;

    INSERT INTO learning_track_assignments
      (track_id, user_id, talent_id, assigned_by, org_id, status, due_at, started_at)
      VALUES (p_track_id, v_uid, v_talent_id, auth.uid(), p_company_id, 'active', p_due_at, now())
      ON CONFLICT (track_id, user_id) DO UPDATE
        SET status = 'active', due_at = EXCLUDED.due_at, assigned_by = EXCLUDED.assigned_by,
            org_id = EXCLUDED.org_id, updated_at = now()
      RETURNING id INTO v_assign_id;

    -- Enroll into each REQUIRED course via org_assign_talents
    FOR r IN SELECT content_id FROM learning_track_items
             WHERE track_id = p_track_id AND is_required = true LOOP
      PERFORM org_assign_talents(p_company_id, r.content_id, NULL, ARRAY[v_uid]::uuid[], p_due_at, NULL, 'Track assignment');
    END LOOP;

    assignment_id := v_assign_id;
    user_id := v_uid;
    RETURN NEXT;
  END LOOP;
END $$;

-- 6. RPC: talent_enroll_track (B2C self-enroll)
CREATE OR REPLACE FUNCTION public.talent_enroll_track(p_track_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assign_id uuid;
  v_talent_id uuid;
  v_track learning_tracks%ROWTYPE;
  r record;
  v_eid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;
  SELECT * INTO v_track FROM learning_tracks WHERE id = p_track_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Track not found'; END IF;

  SELECT id INTO v_talent_id FROM talents WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO learning_track_assignments
    (track_id, user_id, talent_id, assigned_by, status, started_at)
    VALUES (p_track_id, auth.uid(), v_talent_id, auth.uid(), 'active', now())
    ON CONFLICT (track_id, user_id) DO UPDATE SET status = 'active', updated_at = now()
    RETURNING id INTO v_assign_id;

  FOR r IN SELECT content_id FROM learning_track_items
           WHERE track_id = p_track_id AND is_required = true LOOP
    SELECT id INTO v_eid FROM enrollments
      WHERE student_id = auth.uid() AND content_id = r.content_id LIMIT 1;
    IF v_eid IS NULL THEN
      INSERT INTO enrollments (student_id, talent_id, content_id, status)
        VALUES (auth.uid(), v_talent_id, r.content_id, 'active');
    END IF;
  END LOOP;

  RETURN v_assign_id;
END $$;

-- 7. RPC: get_track_progress
CREATE OR REPLACE FUNCTION public.get_track_progress(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a learning_track_assignments%ROWTYPE;
  v_items jsonb;
  v_required int := 0;
  v_required_done int := 0;
  v_optional_done int := 0;
BEGIN
  SELECT * INTO v_a FROM learning_track_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assignment not found'; END IF;
  IF NOT (v_a.user_id = auth.uid()
          OR (v_a.org_id IS NOT NULL AND is_company_member(auth.uid(), v_a.org_id))
          OR has_any_admin_role(auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT
    jsonb_agg(jsonb_build_object(
      'content_id', i.content_id,
      'title', c.title,
      'position', i.position,
      'is_required', i.is_required,
      'status', COALESCE(e.status::text, 'not_started'),
      'completed_at', e.completed_at,
      'percent', CASE WHEN e.completed_at IS NOT NULL THEN 100
                      WHEN e.status::text = 'active' THEN 50 ELSE 0 END
    ) ORDER BY i.position),
    SUM(CASE WHEN i.is_required THEN 1 ELSE 0 END),
    SUM(CASE WHEN i.is_required AND e.completed_at IS NOT NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN NOT i.is_required AND e.completed_at IS NOT NULL THEN 1 ELSE 0 END)
  INTO v_items, v_required, v_required_done, v_optional_done
  FROM learning_track_items i
  JOIN content c ON c.id = i.content_id
  LEFT JOIN enrollments e ON e.content_id = i.content_id AND e.student_id = v_a.user_id
  WHERE i.track_id = v_a.track_id;

  RETURN jsonb_build_object(
    'assignment_id', v_a.id,
    'track_id', v_a.track_id,
    'status', v_a.status,
    'due_at', v_a.due_at,
    'started_at', v_a.started_at,
    'completed_at', v_a.completed_at,
    'items', COALESCE(v_items, '[]'::jsonb),
    'required_total', v_required,
    'required_done', v_required_done,
    'optional_done', v_optional_done,
    'is_complete', v_required > 0 AND v_required_done >= v_required
  );
END $$;

-- 8. Trigger: when enrollment completes, check track completion + mint cert
CREATE OR REPLACE FUNCTION public.on_enrollment_completed_check_tracks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_required int;
  v_done int;
  v_holder text;
  v_talent_id uuid;
  v_existing uuid;
BEGIN
  IF NEW.completed_at IS NULL OR OLD.completed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  FOR r IN
    SELECT a.id AS assignment_id, a.track_id, t.title AS track_title
    FROM learning_track_assignments a
    JOIN learning_tracks t ON t.id = a.track_id
    JOIN learning_track_items i ON i.track_id = a.track_id
    WHERE a.user_id = NEW.student_id
      AND i.content_id = NEW.content_id
      AND a.status NOT IN ('completed','cancelled')
  LOOP
    SELECT
      SUM(CASE WHEN i.is_required THEN 1 ELSE 0 END),
      SUM(CASE WHEN i.is_required AND e.completed_at IS NOT NULL THEN 1 ELSE 0 END)
    INTO v_required, v_done
    FROM learning_track_items i
    LEFT JOIN enrollments e ON e.content_id = i.content_id AND e.student_id = NEW.student_id
    WHERE i.track_id = r.track_id;

    IF v_required > 0 AND v_done >= v_required THEN
      UPDATE learning_track_assignments
        SET status = 'completed', completed_at = now(), updated_at = now()
        WHERE id = r.assignment_id;

      -- Mint track certificate
      SELECT id, full_name INTO v_talent_id, v_holder FROM talents WHERE user_id = NEW.student_id LIMIT 1;
      SELECT id INTO v_existing FROM certificates WHERE track_assignment_id = r.assignment_id LIMIT 1;
      IF v_existing IS NULL AND v_talent_id IS NOT NULL THEN
        INSERT INTO certificates (talent_id, content_id, course_title, holder_name, kind, track_assignment_id)
          VALUES (v_talent_id, NEW.content_id, r.track_title, COALESCE(v_holder, 'Recipient'), 'track', r.assignment_id);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enrollment_completed_check_tracks ON public.enrollments;
CREATE TRIGGER trg_enrollment_completed_check_tracks
  AFTER UPDATE OF completed_at ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.on_enrollment_completed_check_tracks();

-- 9. Public RPC: get_company_branded_catalog
CREATE OR REPLACE FUNCTION public.get_company_branded_catalog(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company companies%ROWTYPE;
  v_tracks jsonb;
BEGIN
  SELECT * INTO v_company FROM companies WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'id', t.id,
    'slug', t.slug,
    'title', t.title,
    'summary', t.summary,
    'cover_url', t.cover_url,
    'enrollment_credits', t.enrollment_credits,
    'item_count', (SELECT COUNT(*) FROM learning_track_items WHERE track_id = t.id)
  ))
  INTO v_tracks
  FROM learning_tracks t
  WHERE t.company_id = v_company.id AND t.is_published = true;

  RETURN jsonb_build_object(
    'company', jsonb_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'slug', v_company.slug,
      'logo_url', v_company.logo_url,
      'banner_url', v_company.banner_url,
      'tagline', v_company.tagline
    ),
    'tracks', COALESCE(v_tracks, '[]'::jsonb)
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_company_branded_catalog(text) TO anon, authenticated;

-- 10. cron-track-sweeps daily schedule
DO $$ BEGIN
  PERFORM cron.unschedule('cron-track-sweeps-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM cron.schedule(
    'cron-track-sweeps-daily',
    '0 6 * * *',
    $cmd$
    SELECT net.http_post(
      url := 'https://iqdnbmnqpgmhtaiesulr.supabase.co/functions/v1/cron-track-sweeps',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object('source','pg_cron')
    );
    $cmd$
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;