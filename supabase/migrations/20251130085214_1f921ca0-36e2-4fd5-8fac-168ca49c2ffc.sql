-- Add cover_image_url column to content table
ALTER TABLE public.content
ADD COLUMN cover_image_url TEXT;

-- Create storage bucket for course covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true);

-- RLS policies for course-covers bucket
-- Allow public to view all images
CREATE POLICY "Public can view course cover images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-covers');

-- Allow admins to insert course cover images
CREATE POLICY "Admins can upload course cover images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-covers' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update course cover images
CREATE POLICY "Admins can update course cover images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-covers' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete course cover images
CREATE POLICY "Admins can delete course cover images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-covers' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);