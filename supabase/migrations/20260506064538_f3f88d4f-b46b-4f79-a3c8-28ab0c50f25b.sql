-- 2.5.e: discriminate review-queue items by signal source (quiz vs scenario)
ALTER TABLE public.talent_skill_profile
  ADD COLUMN IF NOT EXISTS last_source text NOT NULL DEFAULT 'quiz';

ALTER TABLE public.talent_skill_profile
  DROP CONSTRAINT IF EXISTS talent_skill_profile_last_source_check;
ALTER TABLE public.talent_skill_profile
  ADD CONSTRAINT talent_skill_profile_last_source_check
  CHECK (last_source IN ('quiz','scenario'));

CREATE INDEX IF NOT EXISTS idx_talent_skill_profile_last_source
  ON public.talent_skill_profile (talent_id, last_source);

COMMENT ON COLUMN public.talent_skill_profile.last_source IS
  'Origin of the most recent mastery signal: quiz (multiple-choice attempt) or scenario (AI-evaluated role-play).';

-- Patch the quiz-driven trigger fn to stamp last_source = ''quiz''
CREATE OR REPLACE FUNCTION public.fn_update_skill_mastery_from_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_id uuid;
  v_tag text;
  v_quality int;
  v_prev_mastery numeric;
  v_prev_attempts int;
  v_prev_interval int;
  v_prev_ease numeric;
  v_next_interval int;
  v_next_ease numeric;
  v_correct_inc int;
  v_now timestamptz := COALESCE(NEW.created_at, now());
BEGIN
  SELECT content_id INTO v_content_id FROM public.course_modules WHERE id = NEW.module_id;

  v_correct_inc := CASE WHEN NEW.is_correct THEN 1 ELSE 0 END;
  v_quality := CASE WHEN NEW.is_correct THEN 4 ELSE 1 END;

  FOR v_tag IN
    SELECT DISTINCT t
    FROM unnest(COALESCE(NEW.topic_tags, ARRAY[]::text[])) AS t
    WHERE t IS NOT NULL AND length(t) > 0
  LOOP
    SELECT mastery, attempts, interval_days, ease
      INTO v_prev_mastery, v_prev_attempts, v_prev_interval, v_prev_ease
    FROM public.talent_skill_profile
    WHERE talent_id = NEW.talent_id AND module_id = NEW.module_id AND topic_tag = v_tag;

    IF v_prev_mastery IS NULL THEN
      v_prev_mastery := 0.50; v_prev_attempts := 0; v_prev_interval := 0; v_prev_ease := 2.50;
    END IF;

    IF v_quality < 3 THEN
      v_next_interval := 1;
      v_next_ease := GREATEST(1.30, v_prev_ease - 0.20);
    ELSE
      v_next_interval := CASE
        WHEN v_prev_attempts = 0 THEN 1
        WHEN v_prev_attempts = 1 THEN 6
        ELSE GREATEST(1, round(v_prev_interval * v_prev_ease)::int)
      END;
      v_next_ease := GREATEST(
        1.30,
        v_prev_ease + (0.10 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02))
      );
    END IF;

    INSERT INTO public.talent_skill_profile AS sp (
      talent_id, content_id, module_id, topic_tag,
      mastery, attempts, correct_count, last_attempt_at,
      interval_days, ease, due_at, last_reviewed_at, last_source
    )
    VALUES (
      NEW.talent_id, v_content_id, NEW.module_id, v_tag,
      round((0.7 * 0.50 + 0.3 * (CASE WHEN NEW.is_correct THEN 1.0 ELSE 0.0 END))::numeric, 2),
      1, v_correct_inc, v_now,
      v_next_interval, v_next_ease,
      v_now + (v_next_interval || ' days')::interval,
      v_now,
      'quiz'
    )
    ON CONFLICT (talent_id, module_id, topic_tag) DO UPDATE
    SET mastery = round((0.7 * sp.mastery + 0.3 * (CASE WHEN NEW.is_correct THEN 1.0 ELSE 0.0 END))::numeric, 2),
        attempts = sp.attempts + 1,
        correct_count = sp.correct_count + v_correct_inc,
        last_attempt_at = v_now,
        interval_days = v_next_interval,
        ease = v_next_ease,
        due_at = v_now + (v_next_interval || ' days')::interval,
        last_reviewed_at = v_now,
        last_source = 'quiz',
        updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;

-- Patch the scenario-driven trigger fn to stamp last_source = ''scenario''
CREATE OR REPLACE FUNCTION public.fn_update_skill_mastery_from_scenario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_id uuid;
  v_topic jsonb;
  v_tag text;
  v_score numeric;
  v_correct_inc int;
  v_quality int;
  v_prev_mastery numeric;
  v_prev_attempts int;
  v_prev_interval int;
  v_prev_ease numeric;
  v_next_interval int;
  v_next_ease numeric;
  v_evaluated_at timestamptz;
BEGIN
  IF NEW.evaluation IS NULL THEN RETURN NEW; END IF;

  v_evaluated_at := COALESCE((NEW.evaluation->>'evaluated_at')::timestamptz, now());

  SELECT content_id INTO v_content_id FROM public.course_modules WHERE id = NEW.module_id;

  FOR v_topic IN SELECT * FROM jsonb_array_elements(NEW.evaluation->'topics')
  LOOP
    v_tag := v_topic->>'tag';
    IF v_tag IS NULL OR length(v_tag) = 0 THEN CONTINUE; END IF;

    v_score := GREATEST(0, LEAST(1, COALESCE((v_topic->>'score')::numeric, 0)));
    v_correct_inc := CASE WHEN v_score >= 0.6 THEN 1 ELSE 0 END;
    v_quality := GREATEST(0, LEAST(5, round(v_score * 5)::int));

    SELECT mastery, attempts, interval_days, ease
      INTO v_prev_mastery, v_prev_attempts, v_prev_interval, v_prev_ease
    FROM public.talent_skill_profile
    WHERE talent_id = NEW.talent_id AND module_id = NEW.module_id AND topic_tag = v_tag;

    IF v_prev_mastery IS NULL THEN
      v_prev_mastery := 0.50; v_prev_attempts := 0; v_prev_interval := 0; v_prev_ease := 2.50;
    END IF;

    IF v_quality < 3 THEN
      v_next_interval := 1;
      v_next_ease := GREATEST(1.30, v_prev_ease - 0.20);
    ELSE
      v_next_interval := CASE
        WHEN v_prev_attempts = 0 THEN 1
        WHEN v_prev_attempts = 1 THEN 6
        ELSE GREATEST(1, round(v_prev_interval * v_prev_ease)::int)
      END;
      v_next_ease := GREATEST(
        1.30,
        v_prev_ease + (0.10 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02))
      );
    END IF;

    INSERT INTO public.talent_skill_profile AS sp (
      talent_id, content_id, module_id, topic_tag,
      mastery, attempts, correct_count, last_attempt_at,
      interval_days, ease, due_at, last_reviewed_at, last_source
    )
    VALUES (
      NEW.talent_id, v_content_id, NEW.module_id, v_tag,
      round((0.7 * 0.50 + 0.3 * v_score)::numeric, 2),
      1, v_correct_inc, v_evaluated_at,
      v_next_interval, v_next_ease,
      v_evaluated_at + (v_next_interval || ' days')::interval,
      v_evaluated_at,
      'scenario'
    )
    ON CONFLICT (talent_id, module_id, topic_tag) DO UPDATE
    SET mastery = round((0.7 * sp.mastery + 0.3 * v_score)::numeric, 2),
        attempts = sp.attempts + 1,
        correct_count = sp.correct_count + v_correct_inc,
        last_attempt_at = v_evaluated_at,
        interval_days = v_next_interval,
        ease = v_next_ease,
        due_at = v_evaluated_at + (v_next_interval || ' days')::interval,
        last_reviewed_at = v_evaluated_at,
        last_source = 'scenario',
        updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;