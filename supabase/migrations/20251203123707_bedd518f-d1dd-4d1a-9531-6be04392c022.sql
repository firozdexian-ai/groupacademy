-- Drop the existing restrictive policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active profession categories" ON profession_categories;

-- Create a PERMISSIVE policy (this is the default, explicit for clarity)
CREATE POLICY "Anyone can view active profession categories"
  ON profession_categories
  FOR SELECT
  TO public
  USING (is_active = true);