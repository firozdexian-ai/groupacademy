-- Add welcome_sent_at to talents table for tracking one-time welcome messages
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz;

-- Add applicant_notified_at to job_applications table for tracking one-time notifications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS applicant_notified_at timestamptz;