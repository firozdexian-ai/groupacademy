
-- Cache table for extracted application questions
CREATE TABLE public.external_application_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_url text NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  extraction_method text NOT NULL DEFAULT 'firecrawl',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index on URL for cache lookups
CREATE UNIQUE INDEX idx_external_app_questions_url ON public.external_application_questions (application_url);

-- Enable RLS
ALTER TABLE public.external_application_questions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read cached questions
CREATE POLICY "Authenticated users can read cached questions"
  ON public.external_application_questions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only service role can insert/update (edge functions use service role)
-- No insert/update policies for regular users

-- Trigger for updated_at
CREATE TRIGGER update_external_app_questions_updated_at
  BEFORE UPDATE ON public.external_application_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
