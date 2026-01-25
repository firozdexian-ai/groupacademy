-- Create outreach_messages table for tracking product-wise WhatsApp outreach
CREATE TABLE public.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  product text NOT NULL,
  message_content text,
  sent_by uuid REFERENCES auth.users(id),
  sent_at timestamptz DEFAULT now(),
  course_id uuid REFERENCES public.content(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create unique index for non-course products to prevent duplicates
CREATE UNIQUE INDEX outreach_messages_talent_product_unique 
ON public.outreach_messages(talent_id, product) 
WHERE product != 'course';

-- Enable RLS
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all outreach messages"
ON public.outreach_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage outreach messages"
ON public.outreach_messages FOR ALL
USING (has_role(auth.uid(), 'talent_exec'::app_role))
WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

-- Add index for faster lookups
CREATE INDEX outreach_messages_talent_id_idx ON public.outreach_messages(talent_id);
CREATE INDEX outreach_messages_product_idx ON public.outreach_messages(product);