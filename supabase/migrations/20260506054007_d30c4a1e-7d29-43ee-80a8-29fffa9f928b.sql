CREATE OR REPLACE FUNCTION public.fn_update_skill_mastery_from_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_id uuid;
  v_item_id uuid;
  v_idx int;
  v_answer jsonb;
  v_was_correct boolean;
  v_tag text;
  v_tags text[];
BEGIN
  -- Resolve content_id from module
  SELECT content_id INTO v_content_id
  FROM public.course_modules
  WHERE id = NEW.module_id;

  IF v_content_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Iterate items in this attempt
  FOR v_idx IN 1 .. COALESCE(array_length(NEW.item_ids, 1), 0) LOOP
    v_item_id := NEW.item_ids[v_idx];
    v_answer := NEW.answers -> (v_idx - 1);

    IF v_answer IS NULL THEN
      CONTINUE;
    END IF;

    -- Accept several common shapes: {is_correct: bool}, {correct: bool}, {selected_index, correct_index}
    v_was_correct := COALESCE(
      (v_answer ->> 'is_correct')::boolean,
      (v_answer ->> 'correct')::boolean,
      CASE
        WHEN (v_answer ? 'selected_index') AND (v_answer ? 'correct_index')
          THEN (v_answer ->> 'selected_index') = (v_answer ->> 'correct_index')
        ELSE NULL
      END,
      false
    );

    -- Lookup topic tags for this item from pool
    SELECT topic_tags INTO v_tags
    FROM public.module_quiz_pool
    WHERE id = v_item_id;

    IF v_tags IS NULL OR array_length(v_tags, 1) IS NULL THEN
      CONTINUE;
    END IF;

    FOREACH v_tag IN ARRAY v_tags LOOP
      IF v_tag IS NULL OR length(trim(v_tag)) = 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.talent_skill_profile AS sp (
        talent_id, content_id, module_id, topic_tag,
        mastery, attempts, correct_count, last_attempt_at
      )
      VALUES (
        NEW.talent_id, v_content_id, NEW.module_id, v_tag,
        round((0.7 * 0.50 + 0.3 * CASE WHEN v_was_correct THEN 1 ELSE 0 END)::numeric, 2),
        1,
        CASE WHEN v_was_correct THEN 1 ELSE 0 END,
        NEW.created_at
      )
      ON CONFLICT (talent_id, module_id, topic_tag) DO UPDATE
      SET mastery = round((0.7 * sp.mastery + 0.3 * CASE WHEN v_was_correct THEN 1 ELSE 0 END)::numeric, 2),
          attempts = sp.attempts + 1,
          correct_count = sp.correct_count + CASE WHEN v_was_correct THEN 1 ELSE 0 END,
          last_attempt_at = NEW.created_at,
          updated_at = now();
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_skill_mastery_from_quiz ON public.talent_quiz_attempt;
CREATE TRIGGER trg_skill_mastery_from_quiz
AFTER INSERT ON public.talent_quiz_attempt
FOR EACH ROW EXECUTE FUNCTION public.fn_update_skill_mastery_from_attempt();