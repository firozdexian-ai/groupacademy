-- Create job_application_access_codes table for job application freemium system
CREATE TABLE public.job_application_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  is_used BOOLEAN DEFAULT false
);

-- Create unique index on code
CREATE UNIQUE INDEX idx_job_application_access_codes_code ON public.job_application_access_codes(code);

-- Enable RLS
ALTER TABLE public.job_application_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage job application access codes"
ON public.job_application_access_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can validate their job application codes"
ON public.job_application_access_codes
FOR SELECT
USING ((is_used = false AND expires_at > now()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can use their job application codes"
ON public.job_application_access_codes
FOR UPDATE
USING (is_used = false AND expires_at > now());