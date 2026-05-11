ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS career_stage_id UUID REFERENCES public.career_stages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.gtm_countries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_talents_career_stage_id ON public.talents(career_stage_id);
CREATE INDEX IF NOT EXISTS idx_talents_school_id ON public.talents(school_id);
CREATE INDEX IF NOT EXISTS idx_talents_country_id ON public.talents(country_id);