-- Create enum for session status
CREATE TYPE session_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Create course_sessions table
CREATE TABLE public.course_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  recording_link TEXT,
  status session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_sessions
CREATE POLICY "Admins can manage all sessions"
  ON public.course_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view sessions"
  ON public.course_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.enrollments e
      JOIN public.students s ON e.student_id = s.id
      WHERE s.user_id = auth.uid()
        AND e.content_id = course_sessions.content_id
        AND e.status IN ('active', 'completed')
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_course_sessions_updated_at
  BEFORE UPDATE ON public.course_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_course_sessions_content_id ON public.course_sessions(content_id);
CREATE INDEX idx_course_sessions_scheduled_date ON public.course_sessions(scheduled_date);
CREATE INDEX idx_course_sessions_instructor_id ON public.course_sessions(instructor_id);