-- Add RLS policies for talent_exec on jobs table
CREATE POLICY "Talent exec can view all jobs"
ON public.jobs FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Talent exec can create jobs"
ON public.jobs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Talent exec can update jobs"
ON public.jobs FOR UPDATE
USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Add RLS policies for talent_exec on companies table
CREATE POLICY "Talent exec can view all companies"
ON public.companies FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Talent exec can create companies"
ON public.companies FOR INSERT
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Talent exec can update companies"
ON public.companies FOR UPDATE
USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Add RLS policies for talent_exec on job_applications table
CREATE POLICY "Talent exec can view all applications"
ON public.job_applications FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

CREATE POLICY "Talent exec can update applications"
ON public.job_applications FOR UPDATE
USING (has_role(auth.uid(), 'talent_exec'::app_role));