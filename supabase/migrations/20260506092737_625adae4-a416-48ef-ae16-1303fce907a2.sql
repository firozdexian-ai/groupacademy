ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS cv_fingerprint TEXT;
CREATE INDEX IF NOT EXISTS idx_talents_cv_fingerprint ON public.talents(cv_fingerprint) WHERE cv_fingerprint IS NOT NULL;