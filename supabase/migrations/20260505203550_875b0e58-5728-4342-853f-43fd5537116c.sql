
-- Boost timestamp on inbox settings (re-using existing per-talent row)
ALTER TABLE public.talent_inbox_settings ADD COLUMN IF NOT EXISTS boost_until timestamptz;

CREATE TABLE IF NOT EXISTS public.talent_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  credits_spent numeric(12,1) NOT NULL,
  boosted_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "talent_boosts owner read" ON public.talent_boosts FOR SELECT
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Full-text search column on talents
ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS search_tsv tsvector;
CREATE OR REPLACE FUNCTION public.talents_search_tsv_trg()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.full_name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.custom_profession,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.country,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce((SELECT string_agg(value::text, ' ') FROM jsonb_array_elements(coalesce(NEW.skills,'[]'::jsonb))), '')), 'B');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_talents_search_tsv ON public.talents;
CREATE TRIGGER trg_talents_search_tsv
BEFORE INSERT OR UPDATE OF full_name, custom_profession, country, skills ON public.talents
FOR EACH ROW EXECUTE FUNCTION public.talents_search_tsv_trg();
CREATE INDEX IF NOT EXISTS idx_talents_search_tsv ON public.talents USING gin(search_tsv);
-- Backfill
UPDATE public.talents SET full_name = full_name WHERE search_tsv IS NULL;

-- RPC: boost profile (100 credits, 24h)
CREATE OR REPLACE FUNCTION public.boost_profile()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid; v_cost numeric := 100; v_until timestamptz; v_balance numeric;
BEGIN
  SELECT id INTO v_me FROM public.talents WHERE user_id = auth.uid();
  IF v_me IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT balance + earned_balance + COALESCE(contact_bonus_balance,0) INTO v_balance FROM public.talent_credits WHERE talent_id = v_me;
  IF COALESCE(v_balance,0) < v_cost THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;
  -- spend order: bonus -> balance -> earned
  UPDATE public.talent_credits SET
    contact_bonus_balance = GREATEST(0, COALESCE(contact_bonus_balance,0) - v_cost),
    balance = balance - GREATEST(0, v_cost - COALESCE(contact_bonus_balance,0)),
    updated_at = now()
  WHERE talent_id = v_me;
  -- normalize negatives (rare path)
  UPDATE public.talent_credits SET earned_balance = earned_balance + balance, balance = 0
    WHERE talent_id = v_me AND balance < 0;
  v_until := now() + interval '24 hours';
  INSERT INTO public.talent_boosts(talent_id, credits_spent, boosted_until) VALUES (v_me, v_cost, v_until);
  INSERT INTO public.talent_inbox_settings(talent_id, boost_until)
    VALUES (v_me, v_until)
    ON CONFLICT (talent_id) DO UPDATE SET boost_until = EXCLUDED.boost_until;
  INSERT INTO public.credit_transactions(talent_id, amount, transaction_type, service_type, reference_id, description, source, is_earned)
    VALUES (v_me, -v_cost, 'spend', 'profile_boost', v_me, '24h profile boost', 'profile_boost', false);
  RETURN jsonb_build_object('ok', true, 'boost_until', v_until);
END;
$$;
