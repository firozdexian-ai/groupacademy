
-- Certificates table for verifiable course completion certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  verify_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  holder_name text NOT NULL,
  course_title text NOT NULL,
  score integer,
  total_questions integer,
  percentage integer,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id)
);

-- Index for fast verify lookups
CREATE INDEX idx_certificates_verify_code ON public.certificates(verify_code);
CREATE INDEX idx_certificates_talent_id ON public.certificates(talent_id);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Public can read certificates by verify_code (for verification page)
CREATE POLICY "Anyone can verify certificates"
  ON public.certificates FOR SELECT
  USING (true);

-- Authenticated users can insert their own certificates
CREATE POLICY "Users can create own certificates"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (
    talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
  );

-- Admins can manage all certificates
CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()));
