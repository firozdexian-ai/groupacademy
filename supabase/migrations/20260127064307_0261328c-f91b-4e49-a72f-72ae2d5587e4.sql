-- Phase 2D & 2F: Add credit_cost column to content and resource_view_states to enrollment_stage_progress
-- Also ensure course-content storage bucket exists

-- Add credit_cost column for direct credit pricing override
ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS credit_cost integer NULL;

COMMENT ON COLUMN public.content.credit_cost IS 'Direct credit cost override. If null, calculated from price (1 credit = 2 taka).';

-- Add resource_view_states column to track viewed resources within stages
ALTER TABLE public.enrollment_stage_progress
ADD COLUMN IF NOT EXISTS resource_view_states jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.enrollment_stage_progress.resource_view_states IS 'Tracks which resources have been viewed: {"resource_id": true}';

-- Create course-content storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Public can view course content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload course content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course content" ON storage.objects;

-- RLS policy for course-content bucket - allow public read
CREATE POLICY "Public can view course content"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content');

-- Allow admins to upload to course-content bucket
CREATE POLICY "Admins can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete from course-content bucket
CREATE POLICY "Admins can delete course content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'admin'::app_role)
);