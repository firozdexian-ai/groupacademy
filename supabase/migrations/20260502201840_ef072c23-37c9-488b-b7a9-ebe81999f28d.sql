-- 1. Bonus pool column on talent_credits
ALTER TABLE public.talent_credits
  ADD COLUMN IF NOT EXISTS contact_bonus_balance numeric(12,1) NOT NULL DEFAULT 0;

ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS source text;

-- 2. Grant ledger for idempotency
CREATE TABLE IF NOT EXISTS public.contact_bonus_grants (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE public.contact_bonus_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can read own grants" ON public.contact_bonus_grants;
CREATE POLICY "User can read own grants"
  ON public.contact_bonus_grants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage grants" ON public.contact_bonus_grants;
CREATE POLICY "Admins manage grants"
  ON public.contact_bonus_grants FOR ALL
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- 3. Trigger to award the bonus
CREATE OR REPLACE FUNCTION public.award_contact_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_inserted_count integer := 0;
  v_new_balance numeric(12,1);
BEGIN
  IF NEW.status = 'active' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.contact_bonus_grants(user_id, company_id)
    VALUES (NEW.user_id, NEW.company_id)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    IF v_inserted_count > 0 THEN
      SELECT id INTO v_talent_id FROM public.talents WHERE user_id = NEW.user_id LIMIT 1;
      IF v_talent_id IS NOT NULL THEN
        INSERT INTO public.talent_credits (talent_id, balance, earned_balance, contact_bonus_balance)
        VALUES (v_talent_id, 0, 0, 250)
        ON CONFLICT (talent_id) DO UPDATE
          SET contact_bonus_balance = public.talent_credits.contact_bonus_balance + 250,
              updated_at = now()
        RETURNING contact_bonus_balance INTO v_new_balance;

        INSERT INTO public.credit_transactions (
          talent_id, amount, balance_after, transaction_type, service_type, description, source
        ) VALUES (
          v_talent_id, 250, COALESCE(v_new_balance, 250),
          'bonus', 'gro10x_contact_bonus',
          'Welcome bonus for joining a Gro10x workspace',
          'contact_bonus'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_contact_bonus ON public.company_members;
CREATE TRIGGER trg_award_contact_bonus
  AFTER INSERT OR UPDATE OF status ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.award_contact_bonus();

-- 4. Internal vs network feed audience
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'network';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feed_posts_audience_chk') THEN
    ALTER TABLE public.feed_posts
      ADD CONSTRAINT feed_posts_audience_chk CHECK (audience IN ('network','internal'));
  END IF;
END$$;

DROP POLICY IF EXISTS "Internal posts visible to company members" ON public.feed_posts;
CREATE POLICY "Internal posts visible to company members"
  ON public.feed_posts FOR SELECT
  TO authenticated
  USING (
    audience = 'internal'
    AND author_company_id IS NOT NULL
    AND public.is_company_member(auth.uid(), author_company_id)
  );

-- 5. Backfill grants for existing active members (no bonus issued — just marks them granted)
INSERT INTO public.contact_bonus_grants(user_id, company_id)
SELECT DISTINCT user_id, company_id
FROM public.company_members
WHERE status = 'active' AND user_id IS NOT NULL
ON CONFLICT DO NOTHING;