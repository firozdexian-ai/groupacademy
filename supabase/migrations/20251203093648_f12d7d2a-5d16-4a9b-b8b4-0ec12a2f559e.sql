-- Create enums for assessment system
CREATE TYPE public.readiness_level AS ENUM ('beginner', 'developing', 'competent', 'proficient', 'expert');
CREATE TYPE public.question_type AS ENUM ('single_choice', 'multiple_choice', 'scale', 'text');

-- 1. Profession Categories table
CREATE TABLE public.profession_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'briefcase',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profession_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active profession categories"
ON public.profession_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage profession categories"
ON public.profession_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Assessment Questions table
CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_category_id UUID REFERENCES public.profession_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'single_choice',
  options JSONB,
  weight INTEGER DEFAULT 1,
  category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active assessment questions"
ON public.assessment_questions FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage assessment questions"
ON public.assessment_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Career Assessments table (stores submissions and results)
CREATE TABLE public.career_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profession_category_id UUID REFERENCES public.profession_categories(id) ON DELETE SET NULL NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  answers JSONB NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  percentage INTEGER NOT NULL DEFAULT 0,
  readiness_level readiness_level NOT NULL DEFAULT 'beginner',
  ai_analysis JSONB,
  improvement_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days')
);

ALTER TABLE public.career_assessments ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (lead capture)
CREATE POLICY "Anyone can submit career assessments"
ON public.career_assessments FOR INSERT
WITH CHECK (true);

-- Users can view their own assessments by email
CREATE POLICY "Users can view own assessments by email"
ON public.career_assessments FOR SELECT
USING (
  email = current_setting('request.jwt.claims', true)::json->>'email'
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage all assessments
CREATE POLICY "Admins can manage all assessments"
ON public.career_assessments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Assessment Access Codes table (for paid retakes)
CREATE TABLE public.assessment_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

ALTER TABLE public.assessment_access_codes ENABLE ROW LEVEL SECURITY;

-- Users can validate codes for their email
CREATE POLICY "Users can validate their assessment codes"
ON public.assessment_access_codes FOR SELECT
USING (
  (is_used = false AND expires_at > now())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage access codes
CREATE POLICY "Admins can manage assessment access codes"
ON public.assessment_access_codes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can update codes (mark as used)
CREATE POLICY "Users can use their assessment codes"
ON public.assessment_access_codes FOR UPDATE
USING (is_used = false AND expires_at > now());

-- Create indexes for performance
CREATE INDEX idx_career_assessments_email ON public.career_assessments(email);
CREATE INDEX idx_career_assessments_created_at ON public.career_assessments(created_at);
CREATE INDEX idx_assessment_questions_category_id ON public.assessment_questions(profession_category_id);
CREATE INDEX idx_assessment_access_codes_email ON public.assessment_access_codes(email);

-- Seed initial profession categories
INSERT INTO public.profession_categories (name, slug, description, icon, display_order) VALUES
('Banking & Finance', 'banking-finance', 'Careers in banking, investment, financial analysis, and accounting', 'landmark', 1),
('Sales & Marketing', 'sales-marketing', 'Careers in sales, digital marketing, brand management, and communications', 'megaphone', 2),
('Technology & IT', 'technology-it', 'Careers in software development, IT support, data science, and cybersecurity', 'laptop', 3),
('Human Resources', 'human-resources', 'Careers in HR management, recruitment, training, and organizational development', 'users', 4),
('Operations & Supply Chain', 'operations-supply-chain', 'Careers in logistics, procurement, manufacturing, and operations management', 'truck', 5),
('Healthcare & Pharma', 'healthcare-pharma', 'Careers in medical, pharmaceutical, and healthcare administration', 'heart-pulse', 6);