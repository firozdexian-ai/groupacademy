
-- 1. Combined ATS pipeline RPC (apps + counts in one round-trip)
CREATE OR REPLACE FUNCTION public.get_employer_pipeline_full(
  p_company_id uuid DEFAULT NULL,
  p_job_id uuid DEFAULT NULL,
  p_limit int DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.has_role(v_uid, 'admin'::app_role);
  v_apps jsonb;
  v_counts jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('apps','[]'::jsonb,'counts','{}'::jsonb);
  END IF;
  IF NOT v_is_admin THEN
    IF p_company_id IS NULL OR NOT public.is_company_member(v_uid, p_company_id) THEN
      RETURN jsonb_build_object('apps','[]'::jsonb,'counts','{}'::jsonb);
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO v_apps FROM (
    SELECT ja.id, ja.job_id, j.title AS job_title, j.company_id, j.company_name,
           ja.talent_id, t.full_name AS talent_name, t.headline AS talent_headline,
           ja.ai_match_score, ja.application_status, ja.created_at, ja.last_status_at,
           ja.cv_url, ja.cover_letter, ja.sourced, ja.sourced_relationship_id
    FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    LEFT JOIN public.talents t ON t.id = ja.talent_id
    WHERE (p_job_id IS NULL OR ja.job_id = p_job_id)
      AND (p_company_id IS NULL OR j.company_id = p_company_id)
    ORDER BY ja.last_status_at DESC NULLS LAST
    LIMIT p_limit
  ) x;

  SELECT COALESCE(jsonb_object_agg(application_status::text, n), '{}'::jsonb) INTO v_counts FROM (
    SELECT ja.application_status, COUNT(*)::int AS n
    FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE (p_job_id IS NULL OR ja.job_id = p_job_id)
      AND (p_company_id IS NULL OR j.company_id = p_company_id)
    GROUP BY ja.application_status
  ) s;

  RETURN jsonb_build_object('apps', v_apps, 'counts', v_counts);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_employer_pipeline_full(uuid,uuid,int) TO authenticated;

-- 2. List bids on a gig (employer view)
CREATE OR REPLACE FUNCTION public.get_employer_gig_bids(p_gig_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.has_role(v_uid, 'admin'::app_role);
  v_gig jsonb;
  v_bids jsonb;
  v_owner uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT row_to_json(g)::jsonb, g.posted_by INTO v_gig, v_owner
  FROM (
    SELECT id, title, description, skill_category, pricing_type, budget_amount,
           budget_currency, deadline, status, posted_by, employer_name, selected_bid_id,
           total_bids, created_at
    FROM public.marketplace_gigs WHERE id = p_gig_id
  ) g;
  IF v_gig IS NULL THEN RETURN '{}'::jsonb; END IF;

  IF NOT v_is_admin AND v_owner IS DISTINCT FROM v_uid THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY (x.created_at) DESC), '[]'::jsonb) INTO v_bids FROM (
    SELECT b.id, b.gig_id, b.talent_id, b.bid_amount, b.cover_letter, b.coached_text,
           b.estimated_days, b.portfolio_links, b.proof_links, b.ai_rationale,
           b.status, b.created_at,
           t.full_name AS talent_name, t.headline AS talent_headline, t.avatar_url AS talent_avatar,
           tts.score AS trust_score
    FROM public.marketplace_bids b
    LEFT JOIN public.talents t ON t.id = b.talent_id
    LEFT JOIN public.talent_trust_score tts ON tts.talent_id = b.talent_id
    WHERE b.gig_id = p_gig_id
  ) x;

  RETURN jsonb_build_object('gig', v_gig, 'bids', v_bids);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_employer_gig_bids(uuid) TO authenticated;

-- 3. Accept a bid: debit company credits, mark contract, reject losers, emit event
CREATE OR REPLACE FUNCTION public.accept_gig_bid(
  p_bid_id uuid,
  p_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_bid record;
  v_gig record;
  v_charge jsonb;
  v_contract_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH');
  END IF;
  IF NOT public.is_company_member(v_uid, p_company_id)
     AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_COMPANY_MEMBER');
  END IF;

  SELECT * INTO v_bid FROM public.marketplace_bids WHERE id = p_bid_id FOR UPDATE;
  IF v_bid.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'BID_NOT_FOUND');
  END IF;
  IF v_bid.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'BID_NOT_PENDING', 'status', v_bid.status);
  END IF;

  SELECT * INTO v_gig FROM public.marketplace_gigs WHERE id = v_bid.gig_id FOR UPDATE;
  IF v_gig.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'GIG_NOT_FOUND');
  END IF;
  IF v_gig.posted_by IS DISTINCT FROM v_uid AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_GIG_OWNER');
  END IF;
  IF v_gig.selected_bid_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'GIG_ALREADY_AWARDED');
  END IF;

  -- Charge company credits (escrow-style debit)
  v_charge := public.charge_company_credits(
    p_company_id,
    v_bid.bid_amount::numeric,
    'gig_award',
    'marketplace_gig',
    'Awarded gig: ' || COALESCE(v_gig.title, ''),
    v_gig.id
  );
  IF NOT (v_charge->>'ok')::boolean THEN
    RETURN jsonb_build_object('ok', false, 'error', v_charge->>'error', 'balance', v_charge->'balance', 'required', v_bid.bid_amount);
  END IF;

  -- Award winner
  UPDATE public.marketplace_bids SET status = 'accepted', updated_at = now() WHERE id = p_bid_id;
  -- Reject losers
  UPDATE public.marketplace_bids
    SET status = 'rejected', updated_at = now()
    WHERE gig_id = v_bid.gig_id AND id <> p_bid_id AND status = 'pending';
  -- Mark gig
  UPDATE public.marketplace_gigs
    SET selected_bid_id = p_bid_id, status = 'in_progress', updated_at = now()
    WHERE id = v_bid.gig_id;
  -- Create contract
  INSERT INTO public.marketplace_contracts (gig_id, bid_id, freelancer_id, employer_name, agreed_amount, status)
  VALUES (v_bid.gig_id, p_bid_id, v_bid.talent_id, v_gig.employer_name, v_bid.bid_amount, 'active')
  RETURNING id INTO v_contract_id;

  -- Emit Swarm event
  INSERT INTO public.platform_events (event_kind, subject_kind, subject_id, payload)
  VALUES ('gig.bid_accepted', 'talent', v_bid.talent_id,
    jsonb_build_object('gig_id', v_bid.gig_id, 'bid_id', p_bid_id,
      'contract_id', v_contract_id, 'amount', v_bid.bid_amount,
      'company_id', p_company_id));

  RETURN jsonb_build_object('ok', true, 'contract_id', v_contract_id, 'balance', v_charge->'balance');
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_gig_bid(uuid, uuid) TO authenticated;
