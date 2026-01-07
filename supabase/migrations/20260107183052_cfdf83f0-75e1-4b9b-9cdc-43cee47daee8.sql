-- Fix job_applications RLS policies to use talent_id instead of professional_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON job_applications;

-- Create corrected INSERT policy using talent_id
CREATE POLICY "Users can insert own applications" 
ON job_applications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_id
    AND talents.user_id = auth.uid()
  )
);

-- Create corrected SELECT policy using talent_id
CREATE POLICY "Users can view own applications" 
ON job_applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_id
    AND talents.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create corrected UPDATE policy using talent_id
CREATE POLICY "Users can update own applications" 
ON job_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_id
    AND talents.user_id = auth.uid()
  )
);