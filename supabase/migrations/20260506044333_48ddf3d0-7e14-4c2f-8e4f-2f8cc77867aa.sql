
-- Quiz pool
CREATE TABLE public.module_quiz_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text,
  difficulty text DEFAULT 'medium',
  topic_tags text[] DEFAULT '{}',
  generated_by text NOT NULL DEFAULT 'ai',
  created_by_talent_id uuid,
  quality_score numeric DEFAULT 0,
  times_served integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mqp_module ON public.module_quiz_pool(module_id);

-- Scenario pool
CREATE TABLE public.module_scenario_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  scenario_prompt text NOT NULL,
  rubric jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulty text DEFAULT 'medium',
  topic_tags text[] DEFAULT '{}',
  generated_by text NOT NULL DEFAULT 'ai',
  created_by_talent_id uuid,
  quality_score numeric DEFAULT 0,
  times_served integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_msp_module ON public.module_scenario_pool(module_id);

-- Talent attempts
CREATE TABLE public.talent_quiz_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  item_ids uuid[] NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score numeric DEFAULT 0,
  attempt_no integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tqa_talent ON public.talent_quiz_attempt(talent_id, module_id);

CREATE TABLE public.talent_scenario_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES public.module_scenario_pool(id) ON DELETE SET NULL,
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  evaluation jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tsr_talent ON public.talent_scenario_run(talent_id, module_id);

-- Helper: is current user enrolled in the module's course
CREATE OR REPLACE FUNCTION public.is_enrolled_in_module(_module_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM course_modules cm
    JOIN enrollments e ON e.content_id = cm.content_id
    JOIN students s ON s.id = e.student_id
    WHERE cm.id = _module_id
      AND s.user_id = auth.uid()
      AND e.status IN ('active','completed')
  );
$$;

-- RLS
ALTER TABLE public.module_quiz_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_scenario_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_quiz_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_scenario_run ENABLE ROW LEVEL SECURITY;

-- Pools: read for enrolled or admins; no client writes
CREATE POLICY "Enrolled can read quiz pool" ON public.module_quiz_pool
  FOR SELECT USING (public.is_enrolled_in_module(module_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage quiz pool" ON public.module_quiz_pool
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Enrolled can read scenario pool" ON public.module_scenario_pool
  FOR SELECT USING (public.is_enrolled_in_module(module_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage scenario pool" ON public.module_scenario_pool
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Attempts: talent can read/insert own; admin read all
CREATE POLICY "Talent reads own quiz attempts" ON public.talent_quiz_attempt
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Talent inserts own quiz attempts" ON public.talent_quiz_attempt
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Talent reads own scenario runs" ON public.talent_scenario_run
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Talent inserts own scenario runs" ON public.talent_scenario_run
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Talent updates own scenario runs" ON public.talent_scenario_run
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM talents t WHERE t.id = talent_id AND t.user_id = auth.uid())
  );
