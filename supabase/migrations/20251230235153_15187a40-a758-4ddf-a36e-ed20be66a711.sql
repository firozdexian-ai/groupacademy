-- Change mock interview cooldown from 7 days to 30 days
ALTER TABLE mock_interviews 
ALTER COLUMN expires_at SET DEFAULT (now() + '30 days'::interval);

-- Add comment to professionals table marking it as deprecated
COMMENT ON TABLE professionals IS 'DEPRECATED: Use talents table instead. All data has been migrated.';