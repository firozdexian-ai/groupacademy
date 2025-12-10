-- Create job_type enum
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance', 'remote');

-- Create experience_level enum
CREATE TYPE public.experience_level AS ENUM ('entry', 'mid', 'senior', 'executive');

-- Create application_type enum
CREATE TYPE public.application_type AS ENUM ('email', 'link');

-- Create application_status enum
CREATE TYPE public.application_status AS ENUM ('submitted', 'sent_to_employer', 'viewed', 'shortlisted', 'rejected');

-- Create delivery_status enum
CREATE TYPE public.delivery_status AS ENUM ('pending', 'sent', 'failed');

-- Create source_platform enum
CREATE TYPE public.source_platform AS ENUM ('facebook', 'linkedin', 'bdjobs', 'website', 'other');

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT,
  job_type public.job_type NOT NULL DEFAULT 'full_time',
  experience_level public.experience_level NOT NULL DEFAULT 'entry',
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  description TEXT NOT NULL,
  ai_enhanced_description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  application_type public.application_type NOT NULL DEFAULT 'email',
  application_email TEXT,
  application_url TEXT,
  source_url TEXT,
  source_platform public.source_platform DEFAULT 'other',
  profession_category_id UUID REFERENCES public.profession_categories(id),
  deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  cv_url TEXT,
  cover_letter TEXT,
  application_status public.application_status DEFAULT 'submitted',
  delivery_status public.delivery_status DEFAULT 'pending',
  delivery_error TEXT,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_application_usage table for freemium tracking
CREATE TABLE public.job_application_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  free_applications_used INTEGER DEFAULT 0,
  paid_applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(professional_id, month_year)
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_usage ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Anyone can view active jobs"
ON public.jobs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all jobs"
ON public.jobs FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Job applications policies
CREATE POLICY "Users can insert own applications"
ON public.job_applications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_applications.professional_id
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Users can view own applications"
ON public.job_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_applications.professional_id
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all applications"
ON public.job_applications FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Job application usage policies
CREATE POLICY "Users can view own usage"
ON public.job_application_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_application_usage.professional_id
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert own usage"
ON public.job_application_usage FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_application_usage.professional_id
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Users can update own usage"
ON public.job_application_usage FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = job_application_usage.professional_id
    AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Admins can manage all usage"
ON public.job_application_usage FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_application_usage_updated_at
BEFORE UPDATE ON public.job_application_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();