-- ─────────────────────────────────────────────────────────────────
-- COURSE PROJECTS — bundled gig model (Phase 3)
-- ─────────────────────────────────────────────────────────────────

-- Status enum
DO $$ BEGIN
  CREATE TYPE public.course_project_status AS ENUM
    ('open','claimed','in_progress','submitted','approved','paid','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.course_subtask_kind AS ENUM
    ('cover','intro_video','module_slides','module_quiz','module_video',
     'reading','caption','translation','exercise','flashcards','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.course_subtask_status AS ENUM
    ('pending','in_review','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main project table
CREATE TABLE IF NOT EXISTS public.course_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  status public.course_project_status NOT NULL DEFAULT 'open',
  claimed_by uuid REFERENCES public.talents(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  deadline timestamptz,
  total_credit_reward numeric(12,1) NOT NULL DEFAULT 0,
  completion_bonus numeric(12,1) NOT NULL DEFAULT 0,
  progress_percent smallint NOT NULL DEFAULT 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  reviewer_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_projects_status ON public.course_projects(status);
CREATE INDEX IF NOT EXISTS idx_course_projects_claimed_by ON public.course_projects(claimed_by);

-- Subtask table
CREATE TABLE IF NOT EXISTS public.course_project_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.course_projects(id) ON DELETE CASCADE,
  kind public.course_subtask_kind NOT NULL,
  module_id uuid,
  title text NOT NULL,
  brief text,
  expected_format text,
  credit_reward numeric(12,1) NOT NULL DEFAULT 0,
  status public.course_subtask_status NOT NULL DEFAULT 'pending',
  submitted_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_notes text,
  submitted_at timestamptz,
  ai_score numeric(5,2),
  ai_feedback text,
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_project ON public.course_project_subtasks(project_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON public.course_project_subtasks(status);

-- ────────────── Triggers ──────────────
CREATE TRIGGER trg_course_projects_updated
BEFORE UPDATE ON public.course_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_course_subtasks_updated
BEFORE UPDATE ON public.course_project_subtasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ────────────── RLS ──────────────
ALTER TABLE public.course_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_project_subtasks ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can browse projects (the surface itself decides what to show)
CREATE POLICY "Authenticated browse projects"
ON public.course_projects FOR SELECT
TO authenticated
USING (true);

-- Anyone signed in can browse subtasks
CREATE POLICY "Authenticated browse subtasks"
ON public.course_project_subtasks FOR SELECT
TO authenticated
USING (true);

-- Claimer can update their own claimed project (only while not submitted/approved/paid)
CREATE POLICY "Claimer updates own project"
ON public.course_projects FOR UPDATE
TO authenticated
USING (
  claimed_by IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  AND status IN ('claimed','in_progress')
);

-- Claimer can update subtasks of their claimed project
CREATE POLICY "Claimer updates own subtasks"
ON public.course_project_subtasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_projects p
    WHERE p.id = course_project_subtasks.project_id
      AND p.claimed_by IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
      AND p.status IN ('claimed','in_progress')
  )
);

-- Admins and content leads manage everything
CREATE POLICY "Admins manage projects"
ON public.course_projects FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(),'content_lead'::app_role))
WITH CHECK (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(),'content_lead'::app_role));

CREATE POLICY "Admins manage subtasks"
ON public.course_project_subtasks FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(),'content_lead'::app_role))
WITH CHECK (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(),'content_lead'::app_role));

-- ────────────── Helper functions ──────────────

-- Atomically claim an open project for the calling talent
CREATE OR REPLACE FUNCTION public.claim_course_project(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_project RECORD;
BEGIN
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = auth.uid();
  IF v_talent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not signed in');
  END IF;

  SELECT * INTO v_project FROM public.course_projects WHERE id = p_project_id FOR UPDATE;
  IF v_project IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;
  IF v_project.status <> 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project is not open for claiming');
  END IF;

  UPDATE public.course_projects
  SET status = 'claimed',
      claimed_by = v_talent_id,
      claimed_at = now(),
      deadline = COALESCE(deadline, now() + interval '14 days')
  WHERE id = p_project_id;

  RETURN jsonb_build_object('success', true, 'project_id', p_project_id);
END;
$$;

-- Recompute progress percent and roll up to project status
CREATE OR REPLACE FUNCTION public.recompute_course_project_progress(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_done int;
  v_pct smallint;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE status = 'approved')
    INTO v_total, v_done
  FROM public.course_project_subtasks WHERE project_id = p_project_id;

  v_pct := CASE WHEN v_total > 0 THEN ((v_done::numeric / v_total) * 100)::smallint ELSE 0 END;

  UPDATE public.course_projects
  SET progress_percent = v_pct,
      status = CASE
        WHEN v_total > 0 AND v_done = v_total AND status NOT IN ('paid') THEN 'approved'::course_project_status
        ELSE status
      END,
      approved_at = CASE
        WHEN v_total > 0 AND v_done = v_total AND approved_at IS NULL THEN now()
        ELSE approved_at
      END
  WHERE id = p_project_id;
END;
$$;

-- Trigger: any subtask change → recompute parent
CREATE OR REPLACE FUNCTION public.tg_subtask_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_course_project_progress(COALESCE(NEW.project_id, OLD.project_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_subtask_progress
AFTER INSERT OR UPDATE OR DELETE ON public.course_project_subtasks
FOR EACH ROW EXECUTE FUNCTION public.tg_subtask_progress();