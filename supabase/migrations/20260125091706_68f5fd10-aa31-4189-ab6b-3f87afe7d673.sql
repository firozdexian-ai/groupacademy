-- 1. Track INCOMING clicks on content/courses
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Track OUTGOING shares (Your Team's Activity)
CREATE TABLE IF NOT EXISTS content_share_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  shared_by UUID REFERENCES auth.users(id)
);

-- 3. Function to log content clicks
CREATE OR REPLACE FUNCTION track_content_click(p_content_id UUID, p_source TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO content_analytics (content_id, source)
  VALUES (p_content_id, p_source);
END;
$$;

-- 4. Enable RLS
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_share_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for content_analytics (public insert, admin read)
CREATE POLICY "Anyone can insert content analytics"
  ON content_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view content analytics"
  ON content_analytics FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- 6. RLS Policies for content_share_logs (authenticated insert, admin read)
CREATE POLICY "Authenticated users can log content shares"
  ON content_share_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Admins can view content share logs"
  ON content_share_logs FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- 7. Performance indexes
CREATE INDEX idx_content_analytics_content_id ON content_analytics(content_id);
CREATE INDEX idx_content_analytics_source ON content_analytics(source);
CREATE INDEX idx_content_analytics_clicked_at ON content_analytics(clicked_at DESC);
CREATE INDEX idx_content_share_logs_content_id ON content_share_logs(content_id);
CREATE INDEX idx_content_share_logs_channel ON content_share_logs(channel);
CREATE INDEX idx_content_share_logs_shared_at ON content_share_logs(shared_at DESC);