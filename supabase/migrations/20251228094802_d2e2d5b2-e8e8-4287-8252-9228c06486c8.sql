-- Add talent_id column to job_application_usage table
ALTER TABLE public.job_application_usage 
ADD COLUMN IF NOT EXISTS talent_id UUID REFERENCES public.talents(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_application_usage_talent_id 
ON public.job_application_usage(talent_id);

-- Migrate existing data: map professional_id to talent_id via email matching
UPDATE public.job_application_usage jau
SET talent_id = t.id
FROM public.talents t
JOIN public.professionals p ON LOWER(p.email) = LOWER(t.email)
WHERE jau.professional_id = p.id
  AND jau.talent_id IS NULL;

-- Update RLS policies to also check talent_id
DROP POLICY IF EXISTS "Users can view own usage" ON public.job_application_usage;
CREATE POLICY "Users can view own usage" ON public.job_application_usage
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.id = job_application_usage.professional_id
    AND (professionals.user_id = auth.uid() OR professionals.email = (auth.jwt() ->> 'email'::text))
  ))
  OR (EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = job_application_usage.talent_id
    AND (talents.user_id = auth.uid() OR LOWER(talents.email) = LOWER(auth.jwt() ->> 'email'::text))
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can insert own usage" ON public.job_application_usage;
CREATE POLICY "Users can insert own usage" ON public.job_application_usage
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.id = job_application_usage.professional_id
    AND (professionals.user_id = auth.uid() OR professionals.email = (auth.jwt() ->> 'email'::text))
  ))
  OR (EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = job_application_usage.talent_id
    AND (talents.user_id = auth.uid() OR LOWER(talents.email) = LOWER(auth.jwt() ->> 'email'::text))
  ))
);

DROP POLICY IF EXISTS "Users can update own usage" ON public.job_application_usage;
CREATE POLICY "Users can update own usage" ON public.job_application_usage
FOR UPDATE USING (
  (EXISTS (
    SELECT 1 FROM professionals
    WHERE professionals.id = job_application_usage.professional_id
    AND (professionals.user_id = auth.uid() OR professionals.email = (auth.jwt() ->> 'email'::text))
  ))
  OR (EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = job_application_usage.talent_id
    AND (talents.user_id = auth.uid() OR LOWER(talents.email) = LOWER(auth.jwt() ->> 'email'::text))
  ))
);