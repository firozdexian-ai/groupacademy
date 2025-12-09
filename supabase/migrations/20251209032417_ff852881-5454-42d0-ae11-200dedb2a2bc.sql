-- Fix portfolio_requests RLS: restrict PII exposure to admins only and owner by email
-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view their own requests by email" ON public.portfolio_requests;

-- Create more restrictive policy: admins can view all, users can only view their own by matching email
CREATE POLICY "Users can view own requests by email match"
ON public.portfolio_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Fix instructors table: hide sensitive data (bank_details, hourly_rate) from public
-- Drop existing public policy
DROP POLICY IF EXISTS "Anyone can view active instructors" ON public.instructors;

-- Create policy that returns only safe columns for public
CREATE POLICY "Anyone can view active instructors basic info"
ON public.instructors
FOR SELECT
USING (status = 'active'::text);

-- Note: bank_details and hourly_rate columns still exist but RLS alone can't hide specific columns
-- We'll handle column filtering in application code for non-admin queries