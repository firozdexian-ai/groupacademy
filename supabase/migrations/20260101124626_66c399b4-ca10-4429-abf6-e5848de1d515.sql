-- Create contacts table linked to companies
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  designation text,
  department text,
  email text,
  phone text,
  whatsapp_number text,
  linkedin_url text,
  source text DEFAULT 'manual',
  is_primary boolean DEFAULT false,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_phone ON public.contacts(phone);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Admins can manage all contacts"
  ON public.contacts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage contacts"
  ON public.contacts FOR ALL
  USING (has_role(auth.uid(), 'talent_exec'::app_role))
  WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

-- Create contact_outreach table for tracking communications
CREATE TABLE public.contact_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel text NOT NULL,
  message_type text,
  message_content text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_contact_outreach_contact_id ON public.contact_outreach(contact_id);

-- Enable RLS
ALTER TABLE public.contact_outreach ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_outreach
CREATE POLICY "Admins can manage all outreach"
  ON public.contact_outreach FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talent exec can manage outreach"
  ON public.contact_outreach FOR ALL
  USING (has_role(auth.uid(), 'talent_exec'::app_role))
  WITH CHECK (has_role(auth.uid(), 'talent_exec'::app_role));

-- Add address column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address text;