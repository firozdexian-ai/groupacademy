-- Create public bucket for job assets (logos, source images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-assets', 'job-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read for job-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-assets');

-- Allow authenticated uploads
CREATE POLICY "Authenticated upload for job-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-assets');

-- Allow authenticated updates
CREATE POLICY "Authenticated update for job-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'job-assets');

-- Allow authenticated deletes
CREATE POLICY "Authenticated delete for job-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-assets');