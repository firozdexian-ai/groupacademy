-- Fix RLS policy for professionals table to allow anonymous upsert by email
-- Drop the restrictive update policy that requires user_id match
DROP POLICY IF EXISTS "Users can update own professional profile" ON public.professionals;

-- Create new update policy that allows updates when email matches or user owns the record
CREATE POLICY "Users can update professional profile by email or user_id"
ON public.professionals
FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  (email = (auth.jwt() ->> 'email'::text)) OR
  (user_id IS NULL)
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (email = (auth.jwt() ->> 'email'::text)) OR
  (user_id IS NULL)
);