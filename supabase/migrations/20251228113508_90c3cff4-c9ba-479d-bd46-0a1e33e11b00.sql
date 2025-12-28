-- Normalize services_used data from object format {service, date, count} to simple string array
-- This ensures consistent format for easy service tracking checks

UPDATE talents
SET services_used = (
  SELECT COALESCE(
    jsonb_agg(
      DISTINCT CASE 
        WHEN jsonb_typeof(elem) = 'object' AND elem ? 'service' THEN elem->>'service'
        WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
        ELSE NULL
      END
    ) FILTER (WHERE CASE 
        WHEN jsonb_typeof(elem) = 'object' AND elem ? 'service' THEN elem->>'service'
        WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
        ELSE NULL
      END IS NOT NULL),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(services_used) AS elem
)
WHERE services_used IS NOT NULL 
  AND jsonb_array_length(services_used) > 0;