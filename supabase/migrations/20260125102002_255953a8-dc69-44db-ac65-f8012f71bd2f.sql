-- 1. Enable Security
ALTER TABLE job_share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated insert logs" ON job_share_logs;
DROP POLICY IF EXISTS "Allow authenticated select logs" ON job_share_logs;
DROP POLICY IF EXISTS "Allow authenticated insert content logs" ON content_share_logs;
DROP POLICY IF EXISTS "Allow authenticated select content logs" ON content_share_logs;
DROP POLICY IF EXISTS "Allow public insert analytics" ON job_analytics;
DROP POLICY IF EXISTS "Allow authenticated select analytics" ON job_analytics;
DROP POLICY IF EXISTS "Allow public insert content analytics" ON content_analytics;
DROP POLICY IF EXISTS "Allow authenticated select content analytics" ON content_analytics;

-- 3. Allow YOU (Admin) to save "Ticks" (Share Logs)
CREATE POLICY "Allow authenticated insert logs" ON job_share_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select logs" ON job_share_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert content logs" ON content_share_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select content logs" ON content_share_logs FOR SELECT TO authenticated USING (true);

-- 4. Allow EVERYONE to save "Clicks" (Analytics)
CREATE POLICY "Allow public insert analytics" ON job_analytics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select analytics" ON job_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public insert content analytics" ON content_analytics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select content analytics" ON content_analytics FOR SELECT TO authenticated USING (true);