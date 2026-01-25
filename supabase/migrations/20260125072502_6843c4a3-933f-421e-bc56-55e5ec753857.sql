-- Add company_id column to contact_outreach for B2B outreach tracking
ALTER TABLE contact_outreach 
ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- Create index for faster company outreach lookups
CREATE INDEX idx_contact_outreach_company_id ON contact_outreach(company_id);

-- Update RLS policies to allow talent_exec to manage company outreach
-- (existing policies already cover this since they check for talent_exec role)