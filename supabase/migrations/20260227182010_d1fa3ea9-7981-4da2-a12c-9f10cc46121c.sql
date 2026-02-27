-- Add monthly_target column to ai_agents for admin tracking
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS monthly_target integer DEFAULT NULL;