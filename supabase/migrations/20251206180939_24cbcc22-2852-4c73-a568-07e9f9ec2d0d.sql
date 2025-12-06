-- Add new profession categories for students and early career
INSERT INTO profession_categories (name, slug, icon, description, display_order, is_active) VALUES
('Student (Undergraduate)', 'student-undergrad', 'graduation-cap', 'Currently pursuing undergraduate degree', 100, true),
('Student (Graduate/Masters)', 'student-graduate', 'book-open', 'Pursuing or completed graduate studies', 101, true),
('Fresh Graduate', 'fresh-graduate', 'award', 'Recently graduated, entering job market', 102, true),
('Career Changer', 'career-changer', 'refresh-cw', 'Transitioning to a new field', 103, true),
('Other', 'other', 'help-circle', 'Other profession or field of study', 999, true);

-- Add custom_profession and profile_data columns to portfolio_requests
ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS custom_profession text;
ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS profile_data jsonb DEFAULT '{}';

-- Create professionals table for unified profile system
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  profile_type text NOT NULL DEFAULT 'student',
  current_status text,
  profession_category_id uuid REFERENCES profession_categories(id) ON DELETE SET NULL,
  custom_profession text,
  institution text,
  field_of_study text,
  education jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '[]'::jsonb,
  projects jsonb DEFAULT '[]'::jsonb,
  achievements jsonb DEFAULT '[]'::jsonb,
  portfolio_url text,
  portfolio_credentials jsonb,
  cv_url text,
  linkedin_url text,
  profile_photo_url text,
  is_featured boolean DEFAULT false,
  services_used jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on email
CREATE UNIQUE INDEX professionals_email_key ON public.professionals(email);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- RLS policies for professionals
CREATE POLICY "Anyone can view featured professionals"
ON public.professionals FOR SELECT
USING (is_featured = true);

CREATE POLICY "Users can view own professional profile"
ON public.professionals FOR SELECT
USING (auth.uid() = user_id OR email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Anyone can create professional profile"
ON public.professionals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own professional profile"
ON public.professionals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all professionals"
ON public.professionals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();