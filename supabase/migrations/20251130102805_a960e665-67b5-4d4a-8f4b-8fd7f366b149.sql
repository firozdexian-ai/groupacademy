-- Fix enrollment count with trigger
CREATE OR REPLACE FUNCTION public.update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.content 
    SET current_enrollment = current_enrollment + 1 
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.content 
    SET current_enrollment = GREATEST(0, current_enrollment - 1) 
    WHERE id = OLD.content_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_enrollment_count_trigger
AFTER INSERT OR DELETE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_enrollment_count();

-- Fix existing enrollment counts to match actual data
UPDATE public.content
SET current_enrollment = (
  SELECT COUNT(*)
  FROM public.enrollments
  WHERE enrollments.content_id = content.id
);

-- Add display_order column for course ordering
ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_content_display_order ON public.content(display_order);

-- Create banners table for promotional carousel
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_content_id uuid REFERENCES public.content(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage banners"
ON public.banners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order) WHERE is_active = true;