-- Add missing columns to enrollments table for progress tracking
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS current_module_id uuid REFERENCES public.course_modules(id);

-- Create index for performance on last_accessed_at
CREATE INDEX IF NOT EXISTS idx_enrollments_last_accessed ON public.enrollments(last_accessed_at DESC);

-- Create a table to persist stage progress per enrollment and module
CREATE TABLE IF NOT EXISTS public.enrollment_stage_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed_stages integer[] DEFAULT '{}',
  current_stage integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(enrollment_id, module_id)
);

-- Enable RLS on enrollment_stage_progress
ALTER TABLE public.enrollment_stage_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollment_stage_progress
CREATE POLICY "Users can view their own stage progress"
ON public.enrollment_stage_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.talents t ON e.talent_id = t.id
    WHERE e.id = enrollment_stage_progress.enrollment_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own stage progress"
ON public.enrollment_stage_progress
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.talents t ON e.talent_id = t.id
    WHERE e.id = enrollment_stage_progress.enrollment_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own stage progress"
ON public.enrollment_stage_progress
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.talents t ON e.talent_id = t.id
    WHERE e.id = enrollment_stage_progress.enrollment_id
    AND t.user_id = auth.uid()
  )
);

-- Admin can view all stage progress
CREATE POLICY "Admins can view all stage progress"
ON public.enrollment_stage_progress
FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_enrollment_stage_progress_updated_at
BEFORE UPDATE ON public.enrollment_stage_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update enrollment progress percentage
CREATE OR REPLACE FUNCTION public.update_enrollment_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_stages integer := 6; -- 6 stages per module (Orientation, Learn, Practice, Discuss, Assess, Progress)
  v_total_modules integer;
  v_completed_stages integer;
  v_progress_pct integer;
BEGIN
  -- Count total modules for this enrollment's content
  SELECT COUNT(*) INTO v_total_modules
  FROM course_modules cm
  JOIN enrollments e ON e.content_id = cm.content_id
  WHERE e.id = NEW.enrollment_id;

  -- Count total completed stages across all modules
  SELECT COALESCE(SUM(array_length(completed_stages, 1)), 0) INTO v_completed_stages
  FROM enrollment_stage_progress
  WHERE enrollment_id = NEW.enrollment_id;

  -- Calculate progress percentage
  IF v_total_modules > 0 THEN
    v_progress_pct := LEAST(100, (v_completed_stages * 100) / (v_total_modules * v_total_stages));
  ELSE
    v_progress_pct := 0;
  END IF;

  -- Update enrollment progress
  UPDATE enrollments
  SET progress = v_progress_pct,
      last_accessed_at = now(),
      current_module_id = NEW.module_id
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-update enrollment progress
CREATE TRIGGER trigger_update_enrollment_progress
AFTER INSERT OR UPDATE ON public.enrollment_stage_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_enrollment_progress();