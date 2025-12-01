-- Add quiz configuration columns to content table
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS pass_threshold integer DEFAULT 70,
ADD COLUMN IF NOT EXISTS quiz_enabled boolean DEFAULT false;

-- Create course_modules table for course lessons/videos
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  duration_minutes integer,
  display_order integer DEFAULT 0,
  is_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_progress table to track module completion
CREATE TABLE public.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed_at timestamptz,
  last_watched_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, module_id)
);

-- Create quiz_questions table for MCQs
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quiz_attempts table to store quiz results
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  passed boolean NOT NULL,
  answers jsonb NOT NULL,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_modules
CREATE POLICY "Admins can manage course modules"
ON public.course_modules FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view modules"
ON public.course_modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.students s ON e.student_id = s.id
    WHERE s.user_id = auth.uid()
    AND e.content_id = course_modules.content_id
    AND e.status IN ('active', 'completed')
  )
);

CREATE POLICY "Anyone can view preview modules"
ON public.course_modules FOR SELECT
USING (is_preview = true);

-- RLS Policies for student_progress
CREATE POLICY "Admins can view all progress"
ON public.student_progress FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own progress"
ON public.student_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_progress.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Students can update own progress"
ON public.student_progress FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_progress.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Students can update own progress records"
ON public.student_progress FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_progress.student_id
    AND students.user_id = auth.uid()
  )
);

-- RLS Policies for quiz_questions
CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view quiz questions"
ON public.quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.students s ON e.student_id = s.id
    WHERE s.user_id = auth.uid()
    AND e.content_id = quiz_questions.content_id
    AND e.status IN ('active', 'completed')
  )
);

-- RLS Policies for quiz_attempts
CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = quiz_attempts.student_id
    AND students.user_id = auth.uid()
  )
);

CREATE POLICY "Students can insert own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = quiz_attempts.student_id
    AND students.user_id = auth.uid()
  )
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
BEFORE UPDATE ON public.student_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();