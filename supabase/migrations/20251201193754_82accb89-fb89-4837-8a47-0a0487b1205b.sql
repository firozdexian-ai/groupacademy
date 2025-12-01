-- Fix RLS policy conflict on content table
-- Remove overly permissive policy that allows all authenticated users to view unpublished content
DROP POLICY IF EXISTS "Authenticated users can view all content" ON public.content;

-- Add admin-only policy to allow admins to view all content (including unpublished)
CREATE POLICY "Admins can view all content" ON public.content
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));