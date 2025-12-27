-- =============================================
-- Phase 1: Create Unified Talents Table (Fixed)
-- =============================================

-- 1. Create the unified talents table
CREATE TABLE public.talents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  
  -- CV/Profile Data (parsed once, reused everywhere)
  cv_url TEXT,
  cv_text TEXT,
  cv_parsed_at TIMESTAMPTZ,
  
  -- Profession info
  profession_category_id UUID REFERENCES profession_categories(id) ON DELETE SET NULL,
  custom_profession TEXT,
  current_status TEXT,
  field_of_study TEXT,
  institution TEXT,
  
  -- Enriched data (from CV parsing)
  education JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  
  -- Links
  linkedin_url TEXT,
  portfolio_url TEXT,
  profile_photo_url TEXT,
  
  -- Platform engagement tracking (JSONB to match professionals table)
  services_used JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  
  -- Learning status
  learner_status TEXT DEFAULT 'free_learner',
  student_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint on email (case-insensitive)
CREATE UNIQUE INDEX talents_email_unique ON public.talents (LOWER(email));

-- Create index on user_id for fast lookups
CREATE INDEX talents_user_id_idx ON public.talents (user_id);

-- 2. Enable RLS
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Anyone can view featured talents"
ON public.talents FOR SELECT
USING (is_featured = true);

CREATE POLICY "Users can view own talent profile"
ON public.talents FOR SELECT
USING (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "Users can create own talent profile"
ON public.talents FOR INSERT
WITH CHECK (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own talent profile"
ON public.talents FOR UPDATE
USING (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can manage all talents"
ON public.talents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can view all talents"
ON public.talents FOR SELECT
USING (has_role(auth.uid(), 'talent_exec'::app_role));

-- 4. Migrate existing data from professionals
INSERT INTO public.talents (
  user_id, email, full_name, phone,
  cv_url, profession_category_id, custom_profession,
  current_status, field_of_study, institution,
  education, experience, skills, projects, achievements,
  linkedin_url, portfolio_url, profile_photo_url,
  services_used, is_featured, created_at, updated_at
)
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.phone,
  p.cv_url,
  p.profession_category_id,
  p.custom_profession,
  p.current_status,
  p.field_of_study,
  p.institution,
  COALESCE(p.education, '[]'::jsonb),
  COALESCE(p.experience, '[]'::jsonb),
  COALESCE(p.skills, '[]'::jsonb),
  COALESCE(p.projects, '[]'::jsonb),
  COALESCE(p.achievements, '[]'::jsonb),
  p.linkedin_url,
  p.portfolio_url,
  p.profile_photo_url,
  COALESCE(p.services_used, '[]'::jsonb),
  p.is_featured,
  p.created_at,
  p.updated_at
FROM public.professionals p
ON CONFLICT (LOWER(email)) DO NOTHING;

-- 5. Migrate from students (merge if email matches)
INSERT INTO public.talents (
  user_id, email, full_name, phone,
  learner_status, student_id,
  created_at, updated_at
)
SELECT 
  s.user_id,
  s.email,
  s.full_name,
  s.phone,
  s.status::text,
  s.student_id,
  s.created_at,
  s.updated_at
FROM public.students s
ON CONFLICT (LOWER(email)) DO UPDATE SET
  user_id = COALESCE(EXCLUDED.user_id, public.talents.user_id),
  learner_status = EXCLUDED.learner_status,
  student_id = EXCLUDED.student_id,
  phone = COALESCE(EXCLUDED.phone, public.talents.phone);

-- 6. Add talent_id columns to service tables
ALTER TABLE public.career_assessments 
ADD COLUMN talent_id UUID REFERENCES public.talents(id) ON DELETE SET NULL;

ALTER TABLE public.mock_interviews 
ADD COLUMN talent_id UUID REFERENCES public.talents(id) ON DELETE SET NULL;

ALTER TABLE public.salary_analyses 
ADD COLUMN talent_id UUID REFERENCES public.talents(id) ON DELETE SET NULL;

ALTER TABLE public.job_applications 
ADD COLUMN talent_id UUID REFERENCES public.talents(id) ON DELETE SET NULL;

ALTER TABLE public.enrollments 
ADD COLUMN talent_id UUID REFERENCES public.talents(id) ON DELETE SET NULL;

-- 7. Backfill talent_id in service tables
UPDATE public.career_assessments ca
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(ca.email) = LOWER(t.email);

UPDATE public.mock_interviews mi
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(mi.email) = LOWER(t.email);

UPDATE public.salary_analyses sa
SET talent_id = t.id
FROM public.talents t
WHERE LOWER(sa.email) = LOWER(t.email);

UPDATE public.job_applications ja
SET talent_id = t.id
FROM public.professionals p
JOIN public.talents t ON LOWER(p.email) = LOWER(t.email)
WHERE ja.professional_id = p.id;

UPDATE public.enrollments e
SET talent_id = t.id
FROM public.students s
JOIN public.talents t ON LOWER(s.email) = LOWER(t.email)
WHERE e.student_id = s.id;

-- 8. Create indexes on talent_id
CREATE INDEX career_assessments_talent_id_idx ON public.career_assessments(talent_id);
CREATE INDEX mock_interviews_talent_id_idx ON public.mock_interviews(talent_id);
CREATE INDEX salary_analyses_talent_id_idx ON public.salary_analyses(talent_id);
CREATE INDEX job_applications_talent_id_idx ON public.job_applications(talent_id);
CREATE INDEX enrollments_talent_id_idx ON public.enrollments(talent_id);

-- 9. Trigger to auto-create talent on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_talent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.talents (
    user_id,
    email,
    full_name,
    phone
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (LOWER(email)) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.talents.full_name);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_talent
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_talent();

-- 10. Updated_at trigger
CREATE TRIGGER update_talents_updated_at
  BEFORE UPDATE ON public.talents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Helper function to get or create talent
CREATE OR REPLACE FUNCTION public.get_or_create_talent(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id UUID;
BEGIN
  SELECT id INTO v_talent_id
  FROM public.talents
  WHERE LOWER(email) = LOWER(p_email);
  
  IF v_talent_id IS NULL THEN
    INSERT INTO public.talents (email, full_name, phone, user_id)
    VALUES (
      p_email,
      COALESCE(p_full_name, split_part(p_email, '@', 1)),
      p_phone,
      p_user_id
    )
    RETURNING id INTO v_talent_id;
  ELSE
    UPDATE public.talents
    SET 
      full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
      phone = COALESCE(NULLIF(p_phone, ''), phone),
      user_id = COALESCE(p_user_id, user_id),
      updated_at = now()
    WHERE id = v_talent_id;
  END IF;
  
  RETURN v_talent_id;
END;
$$;

-- 12. Function to add service to talent
CREATE OR REPLACE FUNCTION public.add_talent_service(
  p_talent_id UUID,
  p_service TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.talents
  SET 
    services_used = CASE 
      WHEN services_used @> to_jsonb(p_service) THEN services_used
      ELSE services_used || to_jsonb(p_service)
    END,
    updated_at = now()
  WHERE id = p_talent_id;
END;
$$;