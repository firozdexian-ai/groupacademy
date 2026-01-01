-- Add vacancies column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS vacancies integer DEFAULT 1;
COMMENT ON COLUMN public.jobs.vacancies IS 'Number of open positions for this job';

-- Create KPI targets table for configurable monthly/weekly targets
CREATE TABLE public.kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL UNIQUE,
  target_value integer NOT NULL,
  period_type text DEFAULT 'monthly',
  period_start date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;

-- Only admins can manage KPI targets
CREATE POLICY "Admins can manage KPI targets"
ON public.kpi_targets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Talent execs can view KPI targets
CREATE POLICY "Talent exec can view KPI targets"
ON public.kpi_targets
FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- Insert default targets
INSERT INTO public.kpi_targets (metric_name, target_value, period_type) VALUES
  ('jobs_posted', 500, 'monthly'),
  ('total_applications', 1000, 'monthly'),
  ('unique_applicants', 500, 'monthly')
ON CONFLICT (metric_name) DO NOTHING;