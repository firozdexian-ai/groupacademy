-- Batch upload tracking table
CREATE TABLE public.batch_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.batch_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all batch uploads"
ON public.batch_uploads FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage batch uploads"
ON public.batch_uploads FOR ALL
USING (has_role(auth.uid(), 'talent_exec'::app_role))
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

-- Add batch_upload_id to talents table
ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS batch_upload_id UUID REFERENCES public.batch_uploads(id) ON DELETE SET NULL;

-- Lead Hunt Sessions table
CREATE TABLE public.lead_hunt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description TEXT NOT NULL,
  parsed_requirements JSONB, -- skills, experience, etc.
  leads_requested INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, archived
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_hunt_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all lead hunt sessions"
ON public.lead_hunt_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage lead hunt sessions"
ON public.lead_hunt_sessions FOR ALL
USING (has_role(auth.uid(), 'talent_exec'::app_role))
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Users can view own lead hunt sessions"
ON public.lead_hunt_sessions FOR SELECT
USING (auth.uid() = created_by);

-- Lead Hunt Matches table
CREATE TABLE public.lead_hunt_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.lead_hunt_sessions(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  initial_score INTEGER, -- Quick keyword match score (0-100)
  ai_match_score INTEGER, -- Detailed AI score (null until requested)
  ai_analysis JSONB, -- Detailed breakdown
  shortlisted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  scored_at TIMESTAMPTZ,
  UNIQUE(session_id, talent_id)
);

-- Enable RLS
ALTER TABLE public.lead_hunt_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all lead hunt matches"
ON public.lead_hunt_matches FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage lead hunt matches"
ON public.lead_hunt_matches FOR ALL
USING (has_role(auth.uid(), 'talent_exec'::app_role))
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Users can view own lead hunt matches"
ON public.lead_hunt_matches FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.lead_hunt_sessions s 
  WHERE s.id = lead_hunt_matches.session_id AND s.created_by = auth.uid()
));

-- Job Assessments table for AI Assessment feature
CREATE TABLE public.job_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
  questions JSONB NOT NULL, -- Generated questions
  answers JSONB, -- User responses
  voice_recordings JSONB, -- URLs to voice answers
  ai_score INTEGER, -- 0-100
  ai_analysis JSONB, -- Detailed breakdown
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, expired
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  UNIQUE(job_id, talent_id)
);

-- Enable RLS
ALTER TABLE public.job_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all job assessments"
ON public.job_assessments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage job assessments"
ON public.job_assessments FOR ALL
USING (has_role(auth.uid(), 'talent_exec'::app_role))
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Talents can view and update own assessments"
ON public.job_assessments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.talents t 
  WHERE t.id = job_assessments.talent_id 
  AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.talents t 
  WHERE t.id = job_assessments.talent_id 
  AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
));

-- Add AI assessment columns to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ai_assessment_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assessment_config JSONB DEFAULT '{"question_count": 6, "voice_enabled": true}'::jsonb;