-- Allow users to insert their own student profile during signup
CREATE POLICY "Users can insert their own student profile"
ON public.students
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also need to ensure students table accepts new signups properly
-- Update the students table to allow better self-registration flow
COMMENT ON POLICY "Users can insert their own student profile" ON public.students IS 'Allows new users to create their own student record during signup';