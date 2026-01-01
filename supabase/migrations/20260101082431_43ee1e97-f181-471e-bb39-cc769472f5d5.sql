-- Make professional_id nullable since modern applications come from talents, not professionals
ALTER TABLE job_applications 
ALTER COLUMN professional_id DROP NOT NULL;