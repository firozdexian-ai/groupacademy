-- Create feed_interactions table for tracking user preferences
CREATE TABLE public.feed_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('job', 'course', 'video')),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('interested', 'not_interested', 'viewed', 'applied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint to prevent duplicate interactions
CREATE UNIQUE INDEX feed_interactions_unique ON public.feed_interactions(talent_id, item_id, interaction_type);

-- Index for faster queries
CREATE INDEX feed_interactions_talent_idx ON public.feed_interactions(talent_id);
CREATE INDEX feed_interactions_item_idx ON public.feed_interactions(item_id, item_type);

-- Enable RLS
ALTER TABLE public.feed_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for feed_interactions
CREATE POLICY "Users can view own interactions"
ON public.feed_interactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.talents t
    WHERE t.id = feed_interactions.talent_id
    AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Users can insert own interactions"
ON public.feed_interactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.talents t
    WHERE t.id = feed_interactions.talent_id
    AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Users can delete own interactions"
ON public.feed_interactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.talents t
    WHERE t.id = feed_interactions.talent_id
    AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Admins can manage all interactions"
ON public.feed_interactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create ai_recommendations table to cache AI-generated recommendations
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  career_insights JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index for one recommendation set per talent
CREATE UNIQUE INDEX ai_recommendations_talent_unique ON public.ai_recommendations(talent_id);

-- Enable RLS
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_recommendations
CREATE POLICY "Users can view own recommendations"
ON public.ai_recommendations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.talents t
    WHERE t.id = ai_recommendations.talent_id
    AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Users can insert own recommendations"
ON public.ai_recommendations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.talents t
    WHERE t.id = ai_recommendations.talent_id
    AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Users can update own recommendations"
ON public.ai_recommendations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.talents t
    WHERE t.id = ai_recommendations.talent_id
    AND (t.user_id = auth.uid() OR LOWER(t.email) = LOWER(auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Admins can manage all recommendations"
ON public.ai_recommendations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for jobs and content tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content;