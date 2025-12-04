-- Create course-content storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload files
CREATE POLICY "Admins can upload course content"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update files
CREATE POLICY "Admins can update course content"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete course content"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow anyone to view course content (public bucket)
CREATE POLICY "Anyone can view course content"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-content');