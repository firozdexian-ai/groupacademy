-- Create salary_analyses table
CREATE TABLE public.salary_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_text TEXT,
  cv_url TEXT,
  job_description TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  profession_category_id UUID REFERENCES public.profession_categories(id),
  ai_analysis JSONB,
  market_salary_range JSONB,
  skills_gap JSONB,
  negotiation_tips JSONB,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create salary_analysis_access_codes table
CREATE TABLE public.salary_analysis_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.salary_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_analysis_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for salary_analyses
CREATE POLICY "Anyone can submit salary analyses"
  ON public.salary_analyses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own analyses"
  ON public.salary_analyses
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own analyses"
  ON public.salary_analyses
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage all salary analyses"
  ON public.salary_analyses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for salary_analysis_access_codes
CREATE POLICY "Users can validate their salary codes"
  ON public.salary_analysis_access_codes
  FOR SELECT
  USING ((is_used = false AND expires_at > now()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can use their salary codes"
  ON public.salary_analysis_access_codes
  FOR UPDATE
  USING (is_used = false AND expires_at > now());

CREATE POLICY "Admins can manage salary access codes"
  ON public.salary_analysis_access_codes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));