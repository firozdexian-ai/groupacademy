-- Create enum for content types
CREATE TYPE content_type AS ENUM (
  'free_video',
  'recorded_course',
  'live_webinar',
  'batch_class',
  'offline_seminar'
);

-- Create enum for student status
CREATE TYPE student_status AS ENUM (
  'lead',
  'free_learner',
  'enrolled',
  'graduated'
);

-- Create enum for enrollment status
CREATE TYPE enrollment_status AS ENUM (
  'pending_payment',
  'active',
  'completed'
);

-- Create students table (links to auth.users)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status student_status DEFAULT 'lead',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create content table (5 types of content)
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content_type content_type NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Pricing
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- YouTube specific (Type 1)
  youtube_url TEXT,
  
  -- Recorded course specific (Type 2)
  duration_hours INTEGER,
  modules_count INTEGER,
  
  -- Live events (Type 3, 4, 5)
  event_date TIMESTAMPTZ,
  event_duration_minutes INTEGER,
  
  -- Capacity (Type 4, 5)
  max_capacity INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  
  -- Offline seminar specific (Type 5)
  venue_name TEXT,
  venue_address TEXT,
  
  -- Instructor/Speaker
  instructor_name TEXT,
  
  -- Visibility
  is_published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status DEFAULT 'pending_payment',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  payment_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, content_id)
);

-- Create function to auto-generate student IDs
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.students;
  
  NEW.student_id := 'GA-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate student IDs
CREATE TRIGGER generate_student_id_trigger
BEFORE INSERT ON public.students
FOR EACH ROW
WHEN (NEW.student_id IS NULL)
EXECUTE FUNCTION generate_student_id();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY "Students can view own profile"
ON public.students FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile"
ON public.students FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for content (public read, admin write)
CREATE POLICY "Anyone can view published content"
ON public.content FOR SELECT
USING (is_published = true);

CREATE POLICY "Authenticated users can view all content"
ON public.content FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for enrollments
CREATE POLICY "Students can view own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students
  WHERE students.id = enrollments.student_id
  AND students.user_id = auth.uid()
));

CREATE POLICY "Students can insert own enrollments"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students
  WHERE students.id = enrollments.student_id
  AND students.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_published ON public.content(is_published);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_content ON public.enrollments(content_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);