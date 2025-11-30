-- Add is_private flag to content table for B2B courses
ALTER TABLE public.content 
ADD COLUMN is_private boolean DEFAULT false;

-- Create access_codes table for payment workaround
CREATE TABLE public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS on access_codes
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage all access codes
CREATE POLICY "Admins can view all access codes"
ON public.access_codes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert access codes"
ON public.access_codes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update access codes"
ON public.access_codes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete access codes"
ON public.access_codes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Students can view codes to validate them (but not see all codes)
CREATE POLICY "Students can validate their code"
ON public.access_codes FOR SELECT
USING (
  is_active = true 
  AND current_uses < max_uses 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Create index for faster code lookups
CREATE INDEX idx_access_codes_code ON public.access_codes(code);
CREATE INDEX idx_access_codes_content_id ON public.access_codes(content_id);