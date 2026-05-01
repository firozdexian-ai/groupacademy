ALTER TABLE public.content_gigs ADD COLUMN IF NOT EXISTS resource_category text;
ALTER TABLE public.marketplace_gigs ADD COLUMN IF NOT EXISTS resource_category text;

UPDATE public.content_gigs SET resource_category = CASE
  WHEN resource_type IN ('cover','banner','thumbnail','image','poster') THEN 'creative'
  WHEN resource_type IN ('video','intro_video','lecture','screencast') THEN 'video'
  WHEN resource_type IN ('article','reading','script','text','content') THEN 'writing'
  WHEN resource_type IN ('slides','deck','presentation') THEN 'slides'
  WHEN resource_type IN ('quiz','flashcard','flashcards','assessment') THEN 'quizzes'
  WHEN resource_type IN ('exercise','worksheet','practice','lab') THEN 'practice'
  WHEN resource_type IN ('embed','code','widget') THEN 'web_tech'
  WHEN resource_type IN ('audio','podcast') THEN 'audio'
  WHEN resource_type IN ('translation','localization') THEN 'translation'
  ELSE 'writing'
END
WHERE resource_category IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_gigs_resource_category ON public.content_gigs(resource_category);
CREATE INDEX IF NOT EXISTS idx_marketplace_gigs_resource_category ON public.marketplace_gigs(resource_category);

ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';

CREATE TABLE IF NOT EXISTS public.talent_id_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('nid','passport')),
  front_url text NOT NULL,
  back_url text,
  extracted_name text,
  extracted_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  reviewed_by uuid,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_talent_id_docs_talent ON public.talent_id_documents(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_id_docs_status ON public.talent_id_documents(status);
ALTER TABLE public.talent_id_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_id_docs_self_select" ON public.talent_id_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "talent_id_docs_self_insert" ON public.talent_id_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "talent_id_docs_self_update" ON public.talent_id_documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "talent_id_docs_admin_select" ON public.talent_id_documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "talent_id_docs_admin_update" ON public.talent_id_documents
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.talent_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  method text NOT NULL CHECK (method IN ('bkash','bank','paypal','wise')),
  account_name text NOT NULL,
  account_number text NOT NULL,
  bank_name text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_accounts_talent ON public.talent_payout_accounts(talent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_primary_per_talent ON public.talent_payout_accounts(talent_id) WHERE is_primary;
ALTER TABLE public.talent_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_accounts_self_all" ON public.talent_payout_accounts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payout_accounts_admin_select" ON public.talent_payout_accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.enforce_single_primary_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.talent_payout_accounts SET is_primary = false, updated_at = now()
     WHERE talent_id = NEW.talent_id AND id <> NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_single_primary_payout ON public.talent_payout_accounts;
CREATE TRIGGER trg_single_primary_payout
  AFTER INSERT OR UPDATE OF is_primary ON public.talent_payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_primary_payout();

CREATE OR REPLACE FUNCTION public.recompute_talent_verification(p_talent_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_has_photo boolean; v_has_phone boolean; v_has_country boolean;
  v_has_id_verified boolean; v_has_id_pending boolean; v_has_primary_payout boolean;
  v_status text;
BEGIN
  SELECT (profile_photo_url IS NOT NULL AND profile_photo_url <> ''),
         (phone IS NOT NULL AND phone <> ''),
         (country IS NOT NULL AND country <> '')
    INTO v_has_photo, v_has_phone, v_has_country
    FROM public.talents WHERE id = p_talent_id;
  SELECT EXISTS (SELECT 1 FROM public.talent_id_documents WHERE talent_id = p_talent_id AND status = 'verified') INTO v_has_id_verified;
  SELECT EXISTS (SELECT 1 FROM public.talent_id_documents WHERE talent_id = p_talent_id AND status = 'pending')  INTO v_has_id_pending;
  SELECT EXISTS (SELECT 1 FROM public.talent_payout_accounts WHERE talent_id = p_talent_id AND is_primary)       INTO v_has_primary_payout;

  IF v_has_photo AND v_has_phone AND v_has_country AND v_has_id_verified AND v_has_primary_payout THEN
    v_status := 'verified';
  ELSIF v_has_id_pending OR v_has_id_verified OR v_has_primary_payout THEN
    v_status := 'pending';
  ELSE
    v_status := 'unverified';
  END IF;

  UPDATE public.talents SET verification_status = v_status, updated_at = now() WHERE id = p_talent_id;
  RETURN v_status;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_recompute_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_talent_verification(COALESCE(NEW.talent_id, OLD.talent_id));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_id_docs_recompute ON public.talent_id_documents;
CREATE TRIGGER trg_id_docs_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.talent_id_documents
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verification();

DROP TRIGGER IF EXISTS trg_payout_recompute ON public.talent_payout_accounts;
CREATE TRIGGER trg_payout_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.talent_payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_verification();

INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-id-docs', 'talent-id-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "id_docs_self_read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'talent-id-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "id_docs_self_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'talent-id-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "id_docs_self_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'talent-id-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "id_docs_admin_read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'talent-id-docs' AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE OR REPLACE FUNCTION public.enforce_verified_for_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text;
BEGIN
  SELECT verification_status INTO v_status FROM public.talents WHERE id = NEW.talent_id;
  IF COALESCE(v_status, 'unverified') <> 'verified' THEN
    RAISE EXCEPTION 'Profile must be verified before requesting a withdrawal.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_withdrawal_verified ON public.withdrawal_requests;
CREATE TRIGGER trg_withdrawal_verified
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_for_withdrawal();

INSERT INTO public.gigs (category, title, description, credit_reward, is_active, display_order, max_completions_per_user)
SELECT * FROM (VALUES
  ('content_creation','Upload a free educational video','Record a 2-10 min teaching video on any career topic. We host it for free, you earn credits when approved.', 15, true, 100, 50),
  ('content_creation','Write & publish a feed post','Share an insight, story, or tip on the public feed. 200+ chars, approved by mods.', 5, true, 101, 100),
  ('content_creation','Create a community poll','Add a poll on the feed that gets at least 10 votes within 7 days.', 4, true, 102, 50),
  ('job_sharing','Refer a friend who completes onboarding','Invite a friend with your ref link. Earn when they finish profile & verify phone.', 10, true, 103, 100),
  ('job_posting','Submit a verified company lead','Add a company that is actively hiring (with a contact). Approved after we verify.', 8, true, 104, 100),
  ('content_creation','Write a course review','Post an honest review (150+ chars) for a course you completed.', 3, true, 105, 30),
  ('content_creation','Submit a salary data point','Share an anonymized salary entry to power our salary insights.', 2, true, 106, 50),
  ('content_creation','Translate a resource (BN <-> EN)','Translate one academy resource between Bangla and English. Reviewed for quality.', 10, true, 107, 100)
) AS v(category, title, description, credit_reward, is_active, display_order, max_completions_per_user)
WHERE NOT EXISTS (SELECT 1 FROM public.gigs g WHERE g.title = v.title);