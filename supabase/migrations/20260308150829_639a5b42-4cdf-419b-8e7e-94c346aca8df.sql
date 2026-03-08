
-- marketplace_contracts
CREATE TABLE public.marketplace_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.marketplace_gigs(id) ON DELETE CASCADE,
  bid_id uuid NOT NULL REFERENCES public.marketplace_bids(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  employer_name text,
  agreed_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can view own contracts"
  ON public.marketplace_contracts FOR SELECT TO authenticated
  USING (
    freelancer_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "Admins can manage contracts"
  ON public.marketplace_contracts FOR ALL TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- marketplace_deliverables
CREATE TABLE public.marketplace_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can view own deliverables"
  ON public.marketplace_deliverables FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM public.marketplace_contracts
      WHERE freelancer_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    )
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "Freelancers can insert own deliverables"
  ON public.marketplace_deliverables FOR INSERT TO authenticated
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.marketplace_contracts
      WHERE freelancer_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage deliverables"
  ON public.marketplace_deliverables FOR ALL TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- marketplace_reviews
CREATE TABLE public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.marketplace_contracts(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL DEFAULT 'freelancer',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reviews"
  ON public.marketplace_reviews FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Contract freelancers can insert reviews"
  ON public.marketplace_reviews FOR INSERT TO authenticated
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.marketplace_contracts
      WHERE freelancer_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage reviews"
  ON public.marketplace_reviews FOR ALL TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Storage bucket for deliverables
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-deliverables', 'marketplace-deliverables', true);

CREATE POLICY "Authenticated users can upload deliverables"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketplace-deliverables');

CREATE POLICY "Anyone can view deliverables"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'marketplace-deliverables');
