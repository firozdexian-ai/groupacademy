-- Fix function search paths for security (properly drop triggers first)

-- Drop existing triggers
DROP TRIGGER IF EXISTS generate_student_id_trigger ON public.students;
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
DROP TRIGGER IF EXISTS update_content_updated_at ON public.content;
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.students;
  
  NEW.student_id := 'GA-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER generate_student_id_trigger
BEFORE INSERT ON public.students
FOR EACH ROW
WHEN (NEW.student_id IS NULL)
EXECUTE FUNCTION generate_student_id();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();