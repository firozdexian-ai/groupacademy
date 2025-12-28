-- Add talent_id column to portfolio_requests
ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS talent_id UUID REFERENCES talents(id);

-- Migrate existing data by email matching
UPDATE portfolio_requests pr
SET talent_id = t.id
FROM talents t
WHERE LOWER(pr.email) = LOWER(t.email)
  AND pr.talent_id IS NULL;

-- Add deprecation comment
COMMENT ON COLUMN portfolio_requests.talent_id IS 'Links to unified talents table for user tracking';