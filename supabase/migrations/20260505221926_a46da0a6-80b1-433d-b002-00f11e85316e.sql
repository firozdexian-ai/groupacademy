-- Strengthen recorded-course readiness: require EVERY module to be playable
CREATE OR REPLACE FUNCTION public.sync_recorded_course_readiness(p_content_id uuid DEFAULT NULL::uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_count integer := 0;
BEGIN
  WITH per_course AS (
    SELECT c.id,
      (SELECT COUNT(*) FROM public.course_modules cm WHERE cm.content_id = c.id) AS module_count,
      (SELECT COUNT(*) FROM public.course_modules cm
        WHERE cm.content_id = c.id
          AND (
            (cm.video_url IS NOT NULL AND cm.video_url <> '')
            OR EXISTS (
              SELECT 1 FROM public.module_resources mr
              WHERE mr.module_id = cm.id
                AND mr.resource_url IS NOT NULL
                AND mr.resource_url <> ''
            )
          )
      ) AS playable_modules
    FROM public.content c
    WHERE c.content_type = 'recorded_course'
      AND (p_content_id IS NULL OR c.id = p_content_id)
  ), usable AS (
    SELECT id, (module_count > 0 AND playable_modules = module_count) AS is_usable
    FROM per_course
  )
  UPDATE public.content c
     SET is_ready = u.is_usable
    FROM usable u
   WHERE c.id = u.id
     AND c.is_ready IS DISTINCT FROM u.is_usable;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- For recorded courses, route the legacy strict checker to the lenient one to avoid flip-flop
CREATE OR REPLACE FUNCTION public.recompute_content_readiness(_content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_type text; v_school_id uuid;
  v_modules int; v_modules_with_resources int; v_required_missing int;
  v_ready boolean;
BEGIN
  SELECT content_type INTO v_type FROM public.content WHERE id = _content_id;

  IF v_type = 'recorded_course' THEN
    PERFORM public.sync_recorded_course_readiness(_content_id);
  ELSE
    SELECT COUNT(*) INTO v_modules FROM public.course_modules WHERE content_id = _content_id;
    IF v_modules = 0 THEN
      UPDATE public.content SET is_ready = false WHERE id = _content_id;
    ELSE
      SELECT COUNT(DISTINCT cm.id) INTO v_modules_with_resources
      FROM public.course_modules cm
      JOIN public.module_resources mr ON mr.module_id = cm.id
      WHERE cm.content_id = _content_id
        AND mr.resource_url IS NOT NULL AND mr.resource_url <> '';

      SELECT COUNT(*) INTO v_required_missing
      FROM public.course_modules cm
      JOIN public.module_resources mr ON mr.module_id = cm.id
      WHERE cm.content_id = _content_id
        AND mr.is_required = true
        AND (mr.resource_url IS NULL OR mr.resource_url = '');

      v_ready := (v_modules_with_resources = v_modules) AND (v_required_missing = 0);
      UPDATE public.content SET is_ready = v_ready WHERE id = _content_id;
    END IF;
  END IF;

  SELECT public.school_id_for_content(_content_id) INTO v_school_id;
  IF v_school_id IS NOT NULL THEN
    PERFORM public.recompute_school_readiness(v_school_id);
  END IF;
END;
$function$;

-- Backfill all recorded courses now
SELECT public.sync_recorded_course_readiness(NULL);