-- Create mock_interviews table
CREATE TABLE public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  profession_category_id UUID REFERENCES public.profession_categories(id) ON DELETE SET NULL,
  
  -- Interview Configuration
  job_description TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  question_count INTEGER DEFAULT 5,
  difficulty TEXT DEFAULT 'medium',
  additional_notes TEXT,
  
  -- Generated Questions & Answers
  questions JSONB,
  answers JSONB,
  
  -- AI Analysis Results
  ai_feedback JSONB,
  selection_percentage INTEGER,
  performance_level TEXT,
  strengths TEXT[],
  improvement_areas TEXT[],
  
  -- Metadata
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mock_interview_access_codes table
CREATE TABLE public.mock_interview_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_interviews
CREATE POLICY "Anyone can submit mock interviews"
ON public.mock_interviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own interviews"
ON public.mock_interviews
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own interviews"
ON public.mock_interviews
FOR UPDATE
USING (true);

CREATE POLICY "Admins can manage all mock interviews"
ON public.mock_interviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for mock_interview_access_codes
CREATE POLICY "Admins can manage mock interview access codes"
ON public.mock_interview_access_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can validate their mock interview codes"
ON public.mock_interview_access_codes
FOR SELECT
USING ((is_used = false) AND (expires_at > now()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can use their mock interview codes"
ON public.mock_interview_access_codes
FOR UPDATE
USING ((is_used = false) AND (expires_at > now()));

-- Create indexes for performance
CREATE INDEX idx_mock_interviews_email ON public.mock_interviews(email);
CREATE INDEX idx_mock_interviews_status ON public.mock_interviews(status);
CREATE INDEX idx_mock_interview_access_codes_email ON public.mock_interview_access_codes(email);
CREATE INDEX idx_mock_interview_access_codes_code ON public.mock_interview_access_codes(code);