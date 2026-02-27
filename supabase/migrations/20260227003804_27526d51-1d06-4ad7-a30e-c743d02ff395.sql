
-- 1. Create job_apply_clicks table for tracking external apply clicks
CREATE TABLE public.job_apply_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES public.talents(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'unknown'
);

-- Enable RLS
ALTER TABLE public.job_apply_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous clicks allowed from public pages)
CREATE POLICY "Anyone can track apply clicks"
  ON public.job_apply_clicks FOR INSERT
  WITH CHECK (true);

-- Admins can read all clicks
CREATE POLICY "Admins can view all apply clicks"
  ON public.job_apply_clicks FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- Users can see their own clicks
CREATE POLICY "Users can view own apply clicks"
  ON public.job_apply_clicks FOR SELECT
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Index for fast aggregation by job_id
CREATE INDEX idx_job_apply_clicks_job_id ON public.job_apply_clicks(job_id);
CREATE INDEX idx_job_apply_clicks_clicked_at ON public.job_apply_clicks(clicked_at);

-- 2. Create a SECURITY DEFINER function for anonymous click tracking (bypasses RLS for inserts from public pages)
CREATE OR REPLACE FUNCTION public.track_job_apply_click(p_job_id UUID, p_talent_id UUID DEFAULT NULL, p_source TEXT DEFAULT 'unknown')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO job_apply_clicks (job_id, talent_id, source)
  VALUES (p_job_id, p_talent_id, p_source);
END;
$$;

-- 3. Deduplicate existing jobs: keep newest per title+company_name, only delete jobs with no applications
DELETE FROM public.jobs
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY LOWER(TRIM(title)), LOWER(TRIM(company_name))
             ORDER BY created_at DESC
           ) AS rn
    FROM public.jobs
  ) ranked
  WHERE rn > 1
    AND id NOT IN (SELECT job_id FROM public.job_applications)
);
