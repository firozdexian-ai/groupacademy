-- Recompute a single module's progress from enrollment_stage_progress
CREATE OR REPLACE FUNCTION public.fn_recompute_module_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stages int[];
  v_total int := 6;
  v_pct int;
  v_started timestamptz;
  v_completed timestamptz;
BEGIN
  v_stages := COALESCE(NEW.completed_stages, '{}');
  v_pct := LEAST(100, ROUND((array_length(v_stages, 1)::numeric * 100) / NULLIF(v_total, 0))::int);
  v_pct := COALESCE(v_pct, 0);

  -- started_at: preserve earliest, else now if any progress
  SELECT started_at INTO v_started
  FROM public.module_progress
  WHERE enrollment_id = NEW.enrollment_id AND module_id = NEW.module_id;

  IF v_started IS NULL AND (array_length(v_stages, 1) > 0 OR NEW.current_stage > 1) THEN
    v_started := now();
  END IF;

  IF v_pct >= 100 THEN
    v_completed := COALESCE(
      (SELECT completed_at FROM public.module_progress
        WHERE enrollment_id = NEW.enrollment_id AND module_id = NEW.module_id),
      now()
    );
  ELSE
    v_completed := NULL;
  END IF;

  INSERT INTO public.module_progress (
    enrollment_id, module_id, stages_completed, total_stages, progress_pct, started_at, completed_at
  ) VALUES (
    NEW.enrollment_id, NEW.module_id, v_stages, v_total, v_pct, v_started, v_completed
  )
  ON CONFLICT (enrollment_id, module_id) DO UPDATE SET
    stages_completed = EXCLUDED.stages_completed,
    progress_pct = EXCLUDED.progress_pct,
    started_at = COALESCE(public.module_progress.started_at, EXCLUDED.started_at),
    completed_at = EXCLUDED.completed_at,
    updated_at = now();

  -- Cascade recompute of the parent enrollment
  PERFORM public.fn_recompute_enrollment_progress(NEW.enrollment_id);

  RETURN NEW;
END;
$$;

-- Recompute parent enrollment progress + completion
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
  v_was_completed boolean;
BEGIN
  SELECT content_id, (status = 'completed')
    INTO v_content_id, v_was_completed
  FROM public.enrollments WHERE id = p_enrollment_id;

  IF v_content_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_total_modules
  FROM public.course_modules WHERE content_id = v_content_id;

  IF v_total_modules = 0 THEN
    RETURN;
  END IF;

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
      WHEN v_completed_modules = v_total_modules THEN 'completed'::content_status
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

-- Trigger on stage progress
DROP TRIGGER IF EXISTS trg_recompute_module_progress ON public.enrollment_stage_progress;
CREATE TRIGGER trg_recompute_module_progress
AFTER INSERT OR UPDATE OF completed_stages, current_stage
ON public.enrollment_stage_progress
FOR EACH ROW
EXECUTE FUNCTION public.fn_recompute_module_progress();