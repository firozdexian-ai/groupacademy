
-- tool_runs ledger
CREATE TABLE public.tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_key text NOT NULL CHECK (tool_key IN ('cv','assessment','salary','portfolio','score','answers','interview')),
  cost_credits numeric(12,1) NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  job_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_runs_user_created ON public.tool_runs(user_id, created_at DESC);

ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tool runs"
  ON public.tool_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tool runs"
  ON public.tool_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recommender RPC
CREATE OR REPLACE FUNCTION public.get_next_best_tool(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_has_cv boolean;
  v_completeness int;
  v_urgent_job uuid;
  v_unscored_job uuid;
  v_recent_assessment boolean;
  v_recent_salary boolean;
BEGIN
  -- profile signals
  SELECT
    COALESCE(cv_url IS NOT NULL OR cv_file_path IS NOT NULL, false),
    COALESCE(profile_completeness, 0)
    INTO v_has_cv, v_completeness
  FROM public.talents
  WHERE user_id = p_user_id;

  IF NOT COALESCE(v_has_cv, false) THEN
    RETURN jsonb_build_object('tool_key','cv','reason','You have no CV on file yet.');
  END IF;

  IF COALESCE(v_completeness, 0) < 60 THEN
    RETURN jsonb_build_object('tool_key','cv','reason','Your profile is under 60% complete.');
  END IF;

  -- urgent saved job (deadline within 7 days)
  SELECT s.item_id INTO v_urgent_job
  FROM public.saved_items s
  JOIN public.jobs j ON j.id = s.item_id
  WHERE s.user_id = p_user_id
    AND s.item_type = 'job'
    AND j.deadline IS NOT NULL
    AND j.deadline <= (now() + interval '7 days')
    AND j.deadline >= now()
  ORDER BY j.deadline ASC
  LIMIT 1;

  IF v_urgent_job IS NOT NULL THEN
    RETURN jsonb_build_object('tool_key','answers','reason','You have a saved job closing soon.','job_id',v_urgent_job);
  END IF;

  -- saved job without an AI score
  SELECT s.item_id INTO v_unscored_job
  FROM public.saved_items s
  WHERE s.user_id = p_user_id
    AND s.item_type = 'job'
    AND NOT EXISTS (
      SELECT 1 FROM public.tool_runs tr
      WHERE tr.user_id = p_user_id
        AND tr.tool_key = 'score'
        AND tr.job_id = s.item_id
    )
  LIMIT 1;

  IF v_unscored_job IS NOT NULL THEN
    RETURN jsonb_build_object('tool_key','score','reason','See how you match a saved job.','job_id',v_unscored_job);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tool_runs
    WHERE user_id = p_user_id AND tool_key = 'assessment'
      AND created_at > now() - interval '90 days'
  ) INTO v_recent_assessment;

  IF NOT v_recent_assessment THEN
    RETURN jsonb_build_object('tool_key','assessment','reason','Refresh your career assessment.');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tool_runs
    WHERE user_id = p_user_id AND tool_key = 'salary'
      AND created_at > now() - interval '30 days'
  ) INTO v_recent_salary;

  IF NOT v_recent_salary THEN
    RETURN jsonb_build_object('tool_key','salary','reason','Benchmark your market salary.');
  END IF;

  RETURN jsonb_build_object('tool_key','interview','reason','Sharpen your interview skills.');
END;
$$;
