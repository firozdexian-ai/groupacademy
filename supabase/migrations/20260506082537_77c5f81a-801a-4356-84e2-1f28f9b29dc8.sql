-- Translations sidecar
CREATE TABLE public.module_item_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('quiz','scenario')),
  language_code text NOT NULL,
  payload jsonb NOT NULL,
  source text NOT NULL DEFAULT 'ai' CHECK (source IN ('ai','human')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, item_type, language_code)
);

CREATE INDEX idx_mit_item ON public.module_item_translations(item_id, item_type);
CREATE INDEX idx_mit_lang ON public.module_item_translations(language_code);

ALTER TABLE public.module_item_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage item translations"
ON public.module_item_translations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled can read quiz translations"
ON public.module_item_translations
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    item_type = 'quiz' AND EXISTS (
      SELECT 1 FROM public.module_quiz_pool q
      WHERE q.id = module_item_translations.item_id
        AND is_enrolled_in_module(q.module_id)
    )
  )
  OR (
    item_type = 'scenario' AND EXISTS (
      SELECT 1 FROM public.module_scenario_pool s
      WHERE s.id = module_item_translations.item_id
        AND is_enrolled_in_module(s.module_id)
    )
  )
);

CREATE TRIGGER trg_mit_updated
BEFORE UPDATE ON public.module_item_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Authoring trends RPC
CREATE OR REPLACE FUNCTION public.get_authoring_trends(_instructor_id uuid, _days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := has_role(auth.uid(), 'admin'::app_role);
  v_self boolean := auth.uid() = _instructor_id;
  v_since timestamptz := now() - make_interval(days => _days);
  v_prev_since timestamptz := now() - make_interval(days => _days * 2);
  v_result jsonb;
  v_module_ids uuid[];
  v_course_ids uuid[];
  v_total_items int := 0;
  v_quiz_flagged int := 0;
  v_scenario_flagged int := 0;
  v_translations int := 0;
  v_rewrites_gen int := 0;
  v_rewrites_app int := 0;
  v_translations_app int := 0;
  v_flag_breakdown jsonb;
  v_hotspots jsonb;
  v_wins jsonb;
BEGIN
  IF NOT (v_is_admin OR v_self) THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  -- Modules owned by this instructor (via courses.primary_instructor_id, fall back if column absent)
  SELECT COALESCE(array_agg(DISTINCT cm.id), '{}'::uuid[]),
         COALESCE(array_agg(DISTINCT c.id), '{}'::uuid[])
  INTO v_module_ids, v_course_ids
  FROM public.courses c
  JOIN public.course_modules cm ON cm.course_id = c.id
  WHERE c.primary_instructor_id = _instructor_id;

  -- Items totals + flagged counts
  SELECT COUNT(*) INTO v_total_items
  FROM public.module_quiz_pool WHERE module_id = ANY(v_module_ids);

  SELECT COUNT(*) INTO v_quiz_flagged
  FROM public.module_quiz_pool
  WHERE module_id = ANY(v_module_ids)
    AND times_served >= 3
    AND times_correct::numeric / NULLIF(times_served,0) < 0.25;

  SELECT COUNT(*) INTO v_translations
  FROM public.module_item_translations mit
  WHERE (mit.item_type='quiz' AND mit.item_id IN (SELECT id FROM public.module_quiz_pool WHERE module_id = ANY(v_module_ids)))
     OR (mit.item_type='scenario' AND mit.item_id IN (SELECT id FROM public.module_scenario_pool WHERE module_id = ANY(v_module_ids)));

  -- AI assist counts from revision log
  SELECT
    COUNT(*) FILTER (WHERE change_type IN ('rewrite_generated')),
    COUNT(*) FILTER (WHERE change_type IN ('rewrite_applied','ai_rewrite')),
    COUNT(*) FILTER (WHERE change_type = 'translation')
  INTO v_rewrites_gen, v_rewrites_app, v_translations_app
  FROM public.module_item_revision_log
  WHERE created_at >= v_since
    AND (item_id IN (SELECT id FROM public.module_quiz_pool WHERE module_id = ANY(v_module_ids))
      OR item_id IN (SELECT id FROM public.module_scenario_pool WHERE module_id = ANY(v_module_ids)));

  -- Flag breakdown (simplified — derived from quiz pool stats)
  SELECT jsonb_build_object(
    'low_p_value', COUNT(*) FILTER (WHERE times_served >= 3 AND times_correct::numeric/NULLIF(times_served,0) < 0.25),
    'miscalibrated', COUNT(*) FILTER (WHERE difficulty='easy' AND times_served > 0 AND times_correct::numeric/NULLIF(times_served,0) < 0.4),
    'stale', COUNT(*) FILTER (WHERE times_served = 0 AND created_at < now() - interval '60 days'),
    'trivial', COUNT(*) FILTER (WHERE times_served >= 5 AND times_correct::numeric/NULLIF(times_served,0) > 0.95)
  ) INTO v_flag_breakdown
  FROM public.module_quiz_pool
  WHERE module_id = ANY(v_module_ids);

  -- Hotspots: top 5 worst courses by flagged count
  SELECT COALESCE(jsonb_agg(row_to_json(h)), '[]'::jsonb) INTO v_hotspots
  FROM (
    SELECT c.id AS course_id, c.title AS course_title,
           COUNT(*) FILTER (WHERE q.times_served >= 3 AND q.times_correct::numeric/NULLIF(q.times_served,0) < 0.25) AS flagged_count
    FROM public.courses c
    JOIN public.course_modules cm ON cm.course_id = c.id
    JOIN public.module_quiz_pool q ON q.module_id = cm.id
    WHERE c.id = ANY(v_course_ids)
    GROUP BY c.id, c.title
    HAVING COUNT(*) FILTER (WHERE q.times_served >= 3 AND q.times_correct::numeric/NULLIF(q.times_served,0) < 0.25) > 0
    ORDER BY flagged_count DESC
    LIMIT 5
  ) h;

  -- Wins: courses with most resolved revisions in window
  SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb) INTO v_wins
  FROM (
    SELECT c.id AS course_id, c.title AS course_title, COUNT(rl.id) AS resolved_count
    FROM public.courses c
    JOIN public.course_modules cm ON cm.course_id = c.id
    JOIN public.module_quiz_pool q ON q.module_id = cm.id
    JOIN public.module_item_revision_log rl ON rl.item_id = q.id AND rl.created_at >= v_since
    WHERE c.id = ANY(v_course_ids)
    GROUP BY c.id, c.title
    ORDER BY resolved_count DESC
    LIMIT 3
  ) w;

  v_result := jsonb_build_object(
    'totals', jsonb_build_object(
      'courses', COALESCE(array_length(v_course_ids,1), 0),
      'modules', COALESCE(array_length(v_module_ids,1), 0),
      'items', v_total_items,
      'flagged_items', v_quiz_flagged,
      'translated_items', v_translations
    ),
    'flag_breakdown', COALESCE(v_flag_breakdown, '{}'::jsonb),
    'ai_assist', jsonb_build_object(
      'rewrites_generated', v_rewrites_gen,
      'rewrites_applied', v_rewrites_app,
      'translations_applied', v_translations_app
    ),
    'hotspots', v_hotspots,
    'wins', v_wins,
    'window_days', _days
  );
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_authoring_trends(uuid, int) TO authenticated;