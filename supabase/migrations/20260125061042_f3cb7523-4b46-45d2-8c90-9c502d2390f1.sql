-- Add country_code and country columns to talents table
ALTER TABLE talents 
ADD COLUMN IF NOT EXISTS country_code text DEFAULT '+880',
ADD COLUMN IF NOT EXISTS country text DEFAULT 'BD';

-- Add comment for clarity
COMMENT ON COLUMN talents.country_code IS 'Phone country code e.g. +880';
COMMENT ON COLUMN talents.country IS 'ISO 2-letter country code e.g. BD';