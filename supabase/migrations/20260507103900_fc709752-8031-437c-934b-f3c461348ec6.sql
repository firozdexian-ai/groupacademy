-- Dedupe messaging_channels: keep row with unipile_account_id (or most recent) per agent_key
WITH ranked AS (
  SELECT id, agent_key,
         ROW_NUMBER() OVER (
           PARTITION BY agent_key
           ORDER BY (unipile_account_id IS NOT NULL) DESC, updated_at DESC NULLS LAST, created_at DESC
         ) AS rn
  FROM public.messaging_channels
)
DELETE FROM public.messaging_channels
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Add uniqueness so future inserts collide instead of duplicating
ALTER TABLE public.messaging_channels
  ADD CONSTRAINT messaging_channels_agent_key_unique UNIQUE (agent_key);