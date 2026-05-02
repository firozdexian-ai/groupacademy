
-- Add publish gate
ALTER TABLE public.course_projects
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_course_projects_published
  ON public.course_projects(is_published);

-- Tighten talent browse: only published projects visible to general authenticated users.
DROP POLICY IF EXISTS "Authenticated browse projects" ON public.course_projects;
CREATE POLICY "Authenticated browse published projects"
ON public.course_projects FOR SELECT
TO authenticated
USING (
  is_published = true
  OR public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'content_lead'::app_role)
  OR claimed_by IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Authenticated browse subtasks" ON public.course_project_subtasks;
CREATE POLICY "Authenticated browse subtasks of published projects"
ON public.course_project_subtasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_projects p
    WHERE p.id = course_project_subtasks.project_id
      AND (
        p.is_published = true
        OR public.has_any_admin_role(auth.uid())
        OR public.has_role(auth.uid(), 'content_lead'::app_role)
        OR p.claimed_by IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
      )
  )
);

-- Generator: drafts a course_project + subtasks from a course's modules.
CREATE OR REPLACE FUNCTION public.generate_course_project(
  p_course_id uuid,
  p_credit_per_subtask numeric DEFAULT 5,
  p_completion_bonus numeric DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_existing uuid;
  v_module RECORD;
  v_subtask_count int := 0;
  v_total_reward numeric(12,1) := 0;
  v_order smallint := 0;
  v_course RECORD;
BEGIN
  IF NOT (public.has_any_admin_role(auth.uid())
          OR public.has_role(auth.uid(),'content_lead'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id, title INTO v_course FROM public.content WHERE id = p_course_id;
  IF v_course.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course not found');
  END IF;

  SELECT id INTO v_existing FROM public.course_projects WHERE course_id = p_course_id;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project already exists', 'project_id', v_existing);
  END IF;

  -- Create draft project
  INSERT INTO public.course_projects (
    course_id, status, total_credit_reward, completion_bonus,
    is_published, created_by
  )
  VALUES (
    p_course_id, 'open', 0, p_completion_bonus,
    false, auth.uid()
  )
  RETURNING id INTO v_project_id;

  -- Course-level subtasks
  v_order := v_order + 1;
  INSERT INTO public.course_project_subtasks
    (project_id, kind, title, brief, expected_format, credit_reward, display_order)
  VALUES
    (v_project_id, 'cover',
     'Course cover image — ' || v_course.title,
     'Design a 16:9 high-impact cover that reflects the course theme. Keep typography minimal.',
     'PNG / JPG, min 1920x1080',
     p_credit_per_subtask, v_order);
  v_subtask_count := v_subtask_count + 1;
  v_total_reward := v_total_reward + p_credit_per_subtask;

  v_order := v_order + 1;
  INSERT INTO public.course_project_subtasks
    (project_id, kind, title, brief, expected_format, credit_reward, display_order)
  VALUES
    (v_project_id, 'intro_video',
     'Intro / promo video — ' || v_course.title,
     '60–90s promo. Hook → what they''ll learn → who it''s for → CTA.',
     'MP4, 1080p, < 200MB',
     p_credit_per_subtask, v_order);
  v_subtask_count := v_subtask_count + 1;
  v_total_reward := v_total_reward + p_credit_per_subtask;

  -- Per-module subtasks
  FOR v_module IN
    SELECT id, title, display_order
    FROM public.course_modules
    WHERE content_id = p_course_id
    ORDER BY display_order, created_at
  LOOP
    v_order := v_order + 1;
    INSERT INTO public.course_project_subtasks
      (project_id, kind, module_id, title, brief, expected_format, credit_reward, display_order)
    VALUES
      (v_project_id, 'module_slides', v_module.id,
       'Slides — ' || v_module.title,
       'Produce slide deck for this module (10–20 slides). Match the course visual style.',
       'PDF or PPTX',
       p_credit_per_subtask, v_order);

    v_order := v_order + 1;
    INSERT INTO public.course_project_subtasks
      (project_id, kind, module_id, title, brief, expected_format, credit_reward, display_order)
    VALUES
      (v_project_id, 'module_video', v_module.id,
       'Video lesson — ' || v_module.title,
       'Record/edit the teaching video for this module.',
       'MP4, 1080p',
       p_credit_per_subtask, v_order);

    v_order := v_order + 1;
    INSERT INTO public.course_project_subtasks
      (project_id, kind, module_id, title, brief, expected_format, credit_reward, display_order)
    VALUES
      (v_project_id, 'module_quiz', v_module.id,
       'Quiz — ' || v_module.title,
       '5–10 multiple-choice questions covering the module objectives.',
       'JSON / DOCX with answers marked',
       p_credit_per_subtask, v_order);

    v_subtask_count := v_subtask_count + 3;
    v_total_reward := v_total_reward + (p_credit_per_subtask * 3);
  END LOOP;

  -- Roll up reward total
  UPDATE public.course_projects
  SET total_credit_reward = v_total_reward
  WHERE id = v_project_id;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_project_id,
    'subtask_count', v_subtask_count,
    'total_credit_reward', v_total_reward
  );
END;
$$;

-- Hard delete a draft project (only if not yet claimed)
CREATE OR REPLACE FUNCTION public.delete_course_project(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project RECORD;
BEGIN
  IF NOT (public.has_any_admin_role(auth.uid())
          OR public.has_role(auth.uid(),'content_lead'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_project FROM public.course_projects WHERE id = p_project_id;
  IF v_project IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not found');
  END IF;
  IF v_project.claimed_by IS NOT NULL OR v_project.status NOT IN ('open') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete: project already claimed or in progress');
  END IF;

  DELETE FROM public.course_projects WHERE id = p_project_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
