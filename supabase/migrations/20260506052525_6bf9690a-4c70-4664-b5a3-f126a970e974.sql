CREATE OR REPLACE FUNCTION public.fn_recompute_enrollment_progress(p_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_id uuid;
  v_total_modules int;
  v_avg_pct int;
  v_completed_modules int;
BEGIN
  SELECT content_id INTO v_content_id
  FROM public.enrollments WHERE id = p_enrollment_id;

  IF v_content_id IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_total_modules
  FROM public.course_modules WHERE content_id = v_content_id;

  IF v_total_modules = 0 THEN RETURN; END IF;

  SELECT
    COALESCE(ROUND(AVG(COALESCE(mp.progress_pct, 0))), 0)::int,
    COUNT(*) FILTER (WHERE COALESCE(mp.progress_pct, 0) >= 100)
  INTO v_avg_pct, v_completed_modules
  FROM public.course_modules cm
  LEFT JOIN public.module_progress mp
    ON mp.module_id = cm.id AND mp.enrollment_id = p_enrollment_id
  WHERE cm.content_id = v_content_id;

  UPDATE public.enrollments
  SET
    progress = LEAST(100, v_avg_pct),
    last_accessed_at = now(),
    status = CASE
      WHEN v_completed_modules = v_total_modules THEN 'completed'::enrollment_status
      ELSE status
    END,
    completed_at = CASE
      WHEN v_completed_modules = v_total_modules AND completed_at IS NULL THEN now()
      ELSE completed_at
    END,
    updated_at = now()
  WHERE id = p_enrollment_id;
END;
$$;

-- Backfill 1: from enrollment_stage_progress
INSERT INTO public.module_progress (
  enrollment_id, module_id, stages_completed, total_stages, progress_pct, started_at, completed_at
)
SELECT
  esp.enrollment_id, esp.module_id, COALESCE(esp.completed_stages, '{}'), 6,
  LEAST(100, COALESCE(ROUND((COALESCE(array_length(esp.completed_stages, 1), 0)::numeric * 100) / 6)::int, 0)),
  CASE WHEN COALESCE(array_length(esp.completed_stages, 1), 0) > 0 OR esp.current_stage > 1
       THEN COALESCE(esp.created_at, now()) END,
  CASE WHEN COALESCE(array_length(esp.completed_stages, 1), 0) >= 6
       THEN COALESCE(esp.updated_at, now()) END
FROM public.enrollment_stage_progress esp
ON CONFLICT (enrollment_id, module_id) DO NOTHING;

-- Backfill 2: from legacy student_resource_progress
WITH legacy AS (
  SELECT
    e.id AS enrollment_id,
    mr.module_id,
    array_agg(DISTINCT mr.stage_number ORDER BY mr.stage_number) AS stages,
    MIN(srp.completed_at) AS first_at,
    MAX(srp.completed_at) AS last_at
  FROM public.student_resource_progress srp
  JOIN public.module_resources mr ON mr.id = srp.resource_id
  JOIN public.course_modules cm ON cm.id = mr.module_id
  JOIN public.enrollments e
    ON e.content_id = cm.content_id
   AND (e.talent_id = srp.student_id OR e.student_id = srp.student_id)
  WHERE mr.stage_number IS NOT NULL
  GROUP BY e.id, mr.module_id
)
INSERT INTO public.module_progress (
  enrollment_id, module_id, stages_completed, total_stages, progress_pct, started_at, completed_at
)
SELECT
  l.enrollment_id, l.module_id, l.stages, 6,
  LEAST(100, ROUND((COALESCE(array_length(l.stages, 1), 0)::numeric * 100) / 6)::int),
  l.first_at,
  CASE WHEN COALESCE(array_length(l.stages, 1), 0) >= 6 THEN l.last_at END
FROM legacy l
ON CONFLICT (enrollment_id, module_id) DO NOTHING;

-- Refresh enrollment-level progress
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT enrollment_id FROM public.module_progress LOOP
    PERFORM public.fn_recompute_enrollment_progress(r.enrollment_id);
  END LOOP;
END $$;