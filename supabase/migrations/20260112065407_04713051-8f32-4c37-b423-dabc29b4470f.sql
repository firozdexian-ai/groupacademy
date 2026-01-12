-- Phase 1: Create saved_items table for bookmarking feature
CREATE TABLE public.saved_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('job', 'course', 'blog', 'video', 'event')),
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(talent_id, item_id, item_type)
);

-- Enable RLS
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved items" 
ON public.saved_items 
FOR SELECT 
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can save items" 
ON public.saved_items 
FOR INSERT 
WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can unsave items" 
ON public.saved_items 
FOR DELETE 
USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_saved_items_talent ON public.saved_items(talent_id);
CREATE INDEX idx_saved_items_item ON public.saved_items(item_id, item_type);

-- Phase 1: Create organization_waitlist table
CREATE TABLE public.organization_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(email)
);

-- Enable RLS (allow inserts from anyone, but only admins can view)
ALTER TABLE public.organization_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit to waitlist (no auth required for insert)
CREATE POLICY "Anyone can join waitlist" 
ON public.organization_waitlist 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view waitlist
CREATE POLICY "Admins can view waitlist" 
ON public.organization_waitlist 
FOR SELECT 
USING (public.has_any_admin_role(auth.uid()));