-- Phase 18C: Database User Consolidation
-- 1. Drop the duplicate handle_new_user_profile trigger that creates student records
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- 2. Drop the function if no longer used
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- 3. Update enrollments to prefer talent_id over student_id where possible
-- First, populate talent_id from student email matching
UPDATE enrollments e
SET talent_id = t.id
FROM students s
JOIN talents t ON LOWER(s.email) = LOWER(t.email)
WHERE e.student_id = s.id AND e.talent_id IS NULL;

-- 4. Add index for faster talent lookups
CREATE INDEX IF NOT EXISTS idx_talents_email_lower ON talents (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_talents_user_id ON talents (user_id);

-- 5. Add talent_id to enrollments foreign key if not exists (for reference integrity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'enrollments_talent_id_fkey'
  ) THEN
    ALTER TABLE enrollments
    ADD CONSTRAINT enrollments_talent_id_fkey
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE SET NULL;
  END IF;
END $$;