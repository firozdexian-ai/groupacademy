
-- Phase 1: GroUp Academy Hierarchical Learning Structure

-- 1. Create enums for new types
CREATE TYPE public.academy_type AS ENUM ('executive', 'technical');
CREATE TYPE public.profession_level_type AS ENUM ('foundation', 'intermediate', 'executive');
CREATE TYPE public.resource_type AS ENUM (
  'video', 
  'slides', 
  'infographic', 
  'mindmap', 
  'audio_podcast', 
  'flashcards', 
  'ai_scenario',
  'quiz',
  'report'
);

-- 2. Create academies table (Executive Academy, Technical Academy)
CREATE TABLE public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  academy_type academy_type NOT NULL,
  description TEXT,
  primary_language TEXT NOT NULL DEFAULT 'english',
  icon TEXT DEFAULT 'graduation-cap',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create schools table (School of Business, etc.)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  executive_capability_goal TEXT,
  icon TEXT DEFAULT 'book-open',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create profession_levels table (Foundation, Intermediate, Executive)
CREATE TABLE public.profession_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  level_type profession_level_type NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Add school_id and level requirements to profession_categories (now profession_lines)
ALTER TABLE public.profession_categories 
  ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN target_audience TEXT,
  ADD COLUMN career_outcome TEXT;

-- 6. Add profession_level_id to content table for course level tracking
ALTER TABLE public.content 
  ADD COLUMN profession_line_id UUID REFERENCES public.profession_categories(id) ON DELETE SET NULL,
  ADD COLUMN profession_level_id UUID REFERENCES public.profession_levels(id) ON DELETE SET NULL,
  ADD COLUMN learning_objectives JSONB DEFAULT '[]',
  ADD COLUMN estimated_hours INTEGER;

-- 7. Enhance course_modules with learning objectives and time estimates
ALTER TABLE public.course_modules 
  ADD COLUMN learning_objectives TEXT[],
  ADD COLUMN estimated_time_minutes INTEGER DEFAULT 30,
  ADD COLUMN stage_order INTEGER DEFAULT 1;

-- 8. Create module_resources table for multi-format content
CREATE TABLE public.module_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT,
  resource_data JSONB, -- For flashcards, AI scenarios, etc.
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  stage_number INTEGER DEFAULT 1, -- Which stage of 6-stage journey
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create AI instructors table linked to profession lines
CREATE TABLE public.ai_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_line_id UUID NOT NULL REFERENCES public.profession_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  persona TEXT NOT NULL, -- AI personality description
  system_prompt TEXT NOT NULL, -- Base system prompt for AI
  avatar_url TEXT,
  expertise_areas TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profession_line_id) -- One AI instructor per profession line
);

-- 10. Create AI chat sessions for conversation history
CREATE TABLE public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_instructor_id UUID NOT NULL REFERENCES public.ai_instructors(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'course', 'module'
  context_id UUID, -- course or module ID if applicable
  messages JSONB DEFAULT '[]', -- Array of {role, content, timestamp}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create student resource progress tracking
CREATE TABLE public.student_resource_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.module_resources(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  score INTEGER, -- For quizzes/scenarios
  attempts INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  progress_data JSONB, -- For flashcard progress, scenario responses, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, resource_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profession_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_resource_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academies
CREATE POLICY "Anyone can view active academies" ON public.academies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage academies" ON public.academies
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for schools
CREATE POLICY "Anyone can view active schools" ON public.schools
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage schools" ON public.schools
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for profession_levels
CREATE POLICY "Anyone can view active profession levels" ON public.profession_levels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage profession levels" ON public.profession_levels
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for module_resources
CREATE POLICY "Admins can manage module resources" ON public.module_resources
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled students can view module resources" ON public.module_resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.enrollments e ON e.content_id = cm.content_id
      JOIN public.students s ON s.id = e.student_id
      WHERE cm.id = module_resources.module_id
        AND s.user_id = auth.uid()
        AND e.status IN ('active', 'completed')
    )
  );

-- RLS Policies for ai_instructors
CREATE POLICY "Anyone can view active AI instructors" ON public.ai_instructors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage AI instructors" ON public.ai_instructors
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_chat_sessions
CREATE POLICY "Users can view own chat sessions" ON public.ai_chat_sessions
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create chat sessions" ON public.ai_chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own chat sessions" ON public.ai_chat_sessions
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can manage all chat sessions" ON public.ai_chat_sessions
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for student_resource_progress
CREATE POLICY "Students can view own resource progress" ON public.student_resource_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_resource_progress.student_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own resource progress" ON public.student_resource_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_resource_progress.student_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own resource progress" ON public.student_resource_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_resource_progress.student_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all resource progress" ON public.student_resource_progress
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_schools_academy ON public.schools(academy_id);
CREATE INDEX idx_profession_categories_school ON public.profession_categories(school_id);
CREATE INDEX idx_content_profession_line ON public.content(profession_line_id);
CREATE INDEX idx_content_profession_level ON public.content(profession_level_id);
CREATE INDEX idx_module_resources_module ON public.module_resources(module_id);
CREATE INDEX idx_ai_chat_sessions_user ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_instructor ON public.ai_chat_sessions(ai_instructor_id);
CREATE INDEX idx_student_resource_progress_student ON public.student_resource_progress(student_id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_academies_updated_at
  BEFORE UPDATE ON public.academies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_resources_updated_at
  BEFORE UPDATE ON public.module_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_instructors_updated_at
  BEFORE UPDATE ON public.ai_instructors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data: Academies
INSERT INTO public.academies (name, slug, academy_type, description, primary_language, display_order) VALUES
('Executive Academy', 'executive-academy', 'executive', 'Strategic thinking, leadership, and advanced professional skills for university graduates and corporate executives.', 'english', 1),
('Technical Academy', 'technical-academy', 'technical', 'Hands-on technical skills, safety, and international work readiness for vocational workforce.', 'bangla', 2);

-- Seed initial data: Profession Levels
INSERT INTO public.profession_levels (name, slug, level_type, description, display_order) VALUES
('Foundation', 'foundation', 'foundation', 'Entry-level skills for freshers and new recruits. Build core competencies and job-ready fundamentals.', 1),
('Intermediate', 'intermediate', 'intermediate', 'Advanced skills for professionals with 1-3 years experience. Develop specialized expertise.', 2),
('Executive', 'executive', 'executive', 'Leadership and strategic skills for senior professionals. Master executive capabilities.', 3);

-- Seed initial data: Schools (for Executive Academy)
INSERT INTO public.schools (academy_id, name, slug, description, executive_capability_goal, display_order)
SELECT 
  a.id,
  s.name,
  s.slug,
  s.description,
  s.goal,
  s.order_num
FROM public.academies a
CROSS JOIN (VALUES
  ('School of Business', 'school-of-business', 'Management, Finance, Sales, Operations, and Digital Strategy', 'Strategic Leadership, Financial Acumen, Market Expansion', 1),
  ('School of Technology', 'school-of-technology', 'Software Development, Data Science, AI, Cybersecurity, Product Management', 'Digital Transformation, Technical Project Management', 2),
  ('School of Creative & Arts', 'school-of-creative-arts', 'Design, Branding, UI/UX, Content Strategy, Media Production', 'Innovative Thinking, Visual Communication, Brand Strategy', 3),
  ('School of Leadership & HR', 'school-of-leadership-hr', 'People Management, Organizational Development, Ethics, Change Management', 'Talent Acquisition, High-Performance Team Building', 4)
) AS s(name, slug, description, goal, order_num)
WHERE a.slug = 'executive-academy';

-- Update existing profession_categories to link to School of Business
UPDATE public.profession_categories
SET school_id = (SELECT id FROM public.schools WHERE slug = 'school-of-business')
WHERE slug IN ('banking-finance', 'sales-marketing', 'operations-supply-chain');

UPDATE public.profession_categories
SET school_id = (SELECT id FROM public.schools WHERE slug = 'school-of-technology')
WHERE slug = 'technology-it';

UPDATE public.profession_categories
SET school_id = (SELECT id FROM public.schools WHERE slug = 'school-of-leadership-hr')
WHERE slug = 'hr';
