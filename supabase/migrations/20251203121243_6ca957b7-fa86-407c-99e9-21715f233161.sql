-- Create enum for portfolio request status
CREATE TYPE public.portfolio_status AS ENUM ('pending', 'contacted', 'in_progress', 'completed', 'cancelled');

-- Create portfolio_requests table
CREATE TABLE public.portfolio_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  profession_category_id UUID REFERENCES public.profession_categories(id),
  cv_url TEXT,
  certificates JSONB DEFAULT '[]'::jsonb,
  achievements TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  additional_notes TEXT,
  status public.portfolio_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  portfolio_url TEXT,
  portfolio_credentials JSONB,
  assigned_to UUID REFERENCES public.instructors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can submit portfolio requests"
ON public.portfolio_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own requests by email"
ON public.portfolio_requests
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all portfolio requests"
ON public.portfolio_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_portfolio_requests_updated_at
BEFORE UPDATE ON public.portfolio_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for portfolio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-uploads', 'portfolio-uploads', true);

-- Storage policies for portfolio uploads
CREATE POLICY "Anyone can upload portfolio files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'portfolio-uploads');

CREATE POLICY "Anyone can view portfolio files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'portfolio-uploads');

CREATE POLICY "Admins can delete portfolio files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'portfolio-uploads' AND has_role(auth.uid(), 'admin'));