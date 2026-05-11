CREATE TABLE IF NOT EXISTS public.career_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.career_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on career_stages" ON public.career_stages;
CREATE POLICY "Allow public read access on career_stages"
ON public.career_stages FOR SELECT USING (true);

INSERT INTO public.career_stages (name, slug, display_order) VALUES
    ('Undergrad', 'undergrad', 10),
    ('Fresh Graduate', 'fresh-graduate', 20),
    ('Professional', 'professional', 30),
    ('Entrepreneur / Founder', 'entrepreneur-founder', 40),
    ('Freelancer', 'freelancer', 50),
    ('Influencer', 'influencer', 60)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.career_stages SET academy_id = (SELECT id FROM public.academies WHERE slug ILIKE '%executive%' LIMIT 1) WHERE slug IN ('undergrad', 'fresh-graduate', 'professional');
UPDATE public.career_stages SET academy_id = (SELECT id FROM public.academies WHERE slug ILIKE '%entrepreneur%' LIMIT 1) WHERE slug = 'entrepreneur-founder';
UPDATE public.career_stages SET academy_id = (SELECT id FROM public.academies WHERE slug ILIKE '%freelance%' LIMIT 1) WHERE slug = 'freelancer';
UPDATE public.career_stages SET academy_id = (SELECT id FROM public.academies WHERE slug ILIKE '%influencer%' LIMIT 1) WHERE slug = 'influencer';