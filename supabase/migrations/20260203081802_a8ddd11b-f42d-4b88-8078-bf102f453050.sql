-- Create study_abroad_roadmaps table for AI-generated application plans
CREATE TABLE public.study_abroad_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  
  -- Intake preferences
  target_countries TEXT[] NOT NULL,
  degree_level TEXT NOT NULL,
  field_of_study TEXT,
  target_intake TEXT,
  budget_level TEXT,
  ielts_score DECIMAL(3,1),
  has_taken_ielts BOOLEAN DEFAULT false,
  
  -- Profile data snapshot
  cv_text TEXT,
  education_summary JSONB,
  experience_summary JSONB,
  gpa TEXT,
  years_experience INTEGER,
  
  -- Additional preferences
  part_time_work_interest BOOLEAN DEFAULT false,
  family_support BOOLEAN DEFAULT false,
  special_requirements TEXT,
  
  -- AI Output
  roadmap_result JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_abroad_roadmaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own roadmaps
CREATE POLICY "Users can view their own roadmaps"
ON public.study_abroad_roadmaps
FOR SELECT
TO authenticated
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own roadmaps"
ON public.study_abroad_roadmaps
FOR INSERT
TO authenticated
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own roadmaps"
ON public.study_abroad_roadmaps
FOR UPDATE
TO authenticated
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Admin access policy
CREATE POLICY "Admins can view all roadmaps"
ON public.study_abroad_roadmaps
FOR SELECT
TO authenticated
USING (public.has_any_admin_role(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_study_abroad_roadmaps_updated_at
BEFORE UPDATE ON public.study_abroad_roadmaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_study_abroad_roadmaps_talent_id ON public.study_abroad_roadmaps(talent_id);
CREATE INDEX idx_study_abroad_roadmaps_status ON public.study_abroad_roadmaps(status);