-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert analytics" ON public.job_analytics;
DROP POLICY IF EXISTS "Allow public insert content analytics" ON public.content_analytics;

-- Allow ANYONE (including anonymous visitors) to log a click
CREATE POLICY "Allow public insert analytics" 
ON public.job_analytics 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow ANYONE to log content clicks
CREATE POLICY "Allow public insert content analytics" 
ON public.content_analytics 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);