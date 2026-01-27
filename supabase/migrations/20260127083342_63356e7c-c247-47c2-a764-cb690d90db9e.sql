-- Track daily learning activity for streaks and gamification
CREATE TABLE IF NOT EXISTS public.learning_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  minutes_learned integer DEFAULT 0,
  modules_completed integer DEFAULT 0,
  stages_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, activity_date)
);

-- Enable RLS
ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activity
CREATE POLICY "Users can view own learning activity"
  ON public.learning_activity FOR SELECT
  USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own learning activity"
  ON public.learning_activity FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own learning activity"
  ON public.learning_activity FOR UPDATE
  USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

-- Admins can view all activity for analytics
CREATE POLICY "Admins can view all learning activity"
  ON public.learning_activity FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster streak calculations
CREATE INDEX idx_learning_activity_talent_date ON public.learning_activity(talent_id, activity_date DESC);