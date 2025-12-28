-- Migrate job_applications.professional_id references to talent_id
-- Update existing records to populate talent_id based on email matching

UPDATE job_applications ja
SET talent_id = t.id
FROM professionals p
JOIN talents t ON LOWER(p.email) = LOWER(t.email)
WHERE ja.professional_id = p.id
  AND ja.talent_id IS NULL;

-- Add comment to mark professional_id as deprecated
COMMENT ON COLUMN job_applications.professional_id IS 'DEPRECATED: Use talent_id instead. This column will be removed in a future migration.';