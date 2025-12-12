-- Add source_image_url to jobs table for social media job post images
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_image_url text;

-- Create companies table for centralized employer management
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  industry text,
  website text,
  primary_email text,
  secondary_emails jsonb DEFAULT '[]'::jsonb,
  linkedin_url text,
  facebook_url text,
  notes text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add company_id foreign key to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Admins can manage all companies" 
ON public.companies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view companies" 
ON public.companies 
FOR SELECT 
USING (true);

-- Create trigger for updated_at on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();