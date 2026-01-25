-- Enable RLS on all analytics and share log tables
ALTER TABLE public.job_share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated insert logs" ON public.job_share_logs;
DROP POLICY IF EXISTS "Allow authenticated select logs" ON public.job_share_logs;
DROP POLICY IF EXISTS "Allow authenticated insert content logs" ON public.content_share_logs;
DROP POLICY IF EXISTS "Allow authenticated select content logs" ON public.content_share_logs;
DROP POLICY IF EXISTS "Allow public insert analytics" ON public.job_analytics;
DROP POLICY IF EXISTS "Allow authenticated select analytics" ON public.job_analytics;
DROP POLICY IF EXISTS "Allow public insert content analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Allow authenticated select content analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Public can insert service analytics" ON public.service_analytics;
DROP POLICY IF EXISTS "Admins can view service analytics" ON public.service_analytics;
DROP POLICY IF EXISTS "Authenticated users can log service shares" ON public.service_share_logs;
DROP POLICY IF EXISTS "Admins can view service share logs" ON public.service_share_logs;

-- Job Share Logs: Authenticated users can insert and read
CREATE POLICY "Allow authenticated insert logs" ON public.job_share_logs 
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select logs" ON public.job_share_logs 
  FOR SELECT TO authenticated USING (true);

-- Job Analytics: Public can insert, authenticated can read
CREATE POLICY "Allow public insert analytics" ON public.job_analytics 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select analytics" ON public.job_analytics 
  FOR SELECT TO authenticated USING (true);

-- Content Share Logs: Authenticated users can insert and read
CREATE POLICY "Allow authenticated insert content logs" ON public.content_share_logs 
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select content logs" ON public.content_share_logs 
  FOR SELECT TO authenticated USING (true);

-- Content Analytics: Public can insert, authenticated can read
CREATE POLICY "Allow public insert content analytics" ON public.content_analytics 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select content analytics" ON public.content_analytics 
  FOR SELECT TO authenticated USING (true);

-- Service Share Logs: Authenticated users can insert and read
CREATE POLICY "Allow authenticated insert service logs" ON public.service_share_logs 
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select service logs" ON public.service_share_logs 
  FOR SELECT TO authenticated USING (true);

-- Service Analytics: Public can insert, authenticated can read
CREATE POLICY "Allow public insert service analytics" ON public.service_analytics 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select service analytics" ON public.service_analytics 
  FOR SELECT TO authenticated USING (true);