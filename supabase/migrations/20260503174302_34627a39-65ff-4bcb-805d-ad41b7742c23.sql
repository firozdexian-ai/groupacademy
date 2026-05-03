
CREATE TABLE public.institution_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institution_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage clubs" ON public.institution_clubs FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_inst_clubs_institution ON public.institution_clubs(institution_id);
CREATE TRIGGER trg_inst_clubs_updated BEFORE UPDATE ON public.institution_clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.institution_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.institution_clubs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institution_representatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reps" ON public.institution_representatives FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_inst_reps_institution ON public.institution_representatives(institution_id);
CREATE TRIGGER trg_inst_reps_updated BEFORE UPDATE ON public.institution_representatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.institution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'event',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events" ON public.institution_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_inst_events_institution ON public.institution_events(institution_id);
CREATE TRIGGER trg_inst_events_updated BEFORE UPDATE ON public.institution_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
