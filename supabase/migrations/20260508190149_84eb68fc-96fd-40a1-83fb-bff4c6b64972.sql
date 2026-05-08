
-- ================================================================
-- PHASE C1: Enrollment → Course Revenue Split trigger
-- ================================================================

CREATE OR REPLACE FUNCTION public.fn_enrollment_paid_to_splits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eng RECORD;
  v_pct numeric;
  v_gross numeric;
  v_instr numeric;
  v_platform numeric;
  v_currency text := 'BDT';
BEGIN
  -- Only fire when becoming active with payment
  IF COALESCE(NEW.payment_amount, 0) <= 0 THEN
    RETURN NEW;
  END IF;
  IF NEW.status::text NOT IN ('active','completed') THEN
    RETURN NEW;
  END IF;
  -- On UPDATE, only fire if status transitions into active/completed (not on subsequent updates)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status::text IN ('active','completed') THEN
      RETURN NEW;
    END IF;
  END IF;

  v_gross := NEW.payment_amount;

  -- For each active engagement on this content, write a split row (idempotent on source_id+instructor)
  FOR v_eng IN
    SELECT user_id, COALESCE(revenue_share_pct, 60)::numeric AS pct
      FROM public.course_engagements
     WHERE content_id = NEW.content_id
       AND status = 'active'
       AND user_id IS NOT NULL
  LOOP
    v_pct := v_eng.pct;
    v_instr := round(v_gross * v_pct / 100.0, 2);
    v_platform := v_gross - v_instr;

    INSERT INTO public.course_revenue_splits(
      content_id, instructor_user_id, source_table, source_id,
      currency, gross_amount, fees_amount, net_amount,
      instructor_amount, platform_amount, share_pct, status
    )
    SELECT NEW.content_id, v_eng.user_id, 'enrollments', NEW.id,
           v_currency, v_gross, 0, v_gross,
           v_instr, v_platform, v_pct, 'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.course_revenue_splits
       WHERE source_table = 'enrollments'
         AND source_id = NEW.id
         AND instructor_user_id = v_eng.user_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_paid_to_splits ON public.enrollments;
CREATE TRIGGER trg_enrollment_paid_to_splits
AFTER INSERT OR UPDATE OF status, payment_amount ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.fn_enrollment_paid_to_splits();


-- ================================================================
-- PHASE G1: get_gigs_hub_dashboard RPC (single round-trip)
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_gigs_hub_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_talent_id uuid;
  v_featured jsonb;
  v_my_bids jsonb;
  v_my_contracts jsonb;
  v_submission_counts jsonb;
  v_top_matches jsonb;
BEGIN
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = v_uid LIMIT 1;

  -- Featured / active gigs (system gigs)
  SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.display_order NULLS LAST), '[]'::jsonb)
    INTO v_featured
  FROM (
    SELECT id, title, description, category, credit_reward, icon, display_order, requirements
    FROM public.gigs WHERE is_active = true ORDER BY display_order NULLS LAST LIMIT 24
  ) g;

  -- Submission counts per gig for current talent
  SELECT COALESCE(jsonb_object_agg(gig_id::text, n), '{}'::jsonb)
    INTO v_submission_counts
  FROM (
    SELECT gig_id, count(*)::int AS n
      FROM public.gig_submissions
     WHERE v_talent_id IS NOT NULL AND talent_id = v_talent_id
     GROUP BY gig_id
  ) s;

  -- Open marketplace bids by this talent
  SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY (b->>'created_at') DESC), '[]'::jsonb)
    INTO v_my_bids
  FROM (
    SELECT b.id, b.gig_id, b.bid_amount, b.status, b.created_at,
           (SELECT row_to_json(mg) FROM (SELECT id, title, status FROM public.marketplace_gigs WHERE id = b.gig_id) mg) AS gig
      FROM public.marketplace_bids b
     WHERE v_talent_id IS NOT NULL AND b.talent_id = v_talent_id
     ORDER BY b.created_at DESC LIMIT 50
  ) b;

  -- My active contracts
  SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
    INTO v_my_contracts
  FROM (
    SELECT id, gig_id, status, created_at
      FROM public.marketplace_contracts
     WHERE v_talent_id IS NOT NULL AND talent_id = v_talent_id
     ORDER BY created_at DESC LIMIT 50
  ) c;

  -- Top pre-computed matches
  SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY (m->>'score') DESC), '[]'::jsonb)
    INTO v_top_matches
  FROM (
    SELECT id AS match_id, gig_id, gig_kind, score, why_text, status, expires_at
      FROM public.gig_matches
     WHERE v_talent_id IS NOT NULL AND talent_id = v_talent_id
       AND status IN ('offered','viewed')
     ORDER BY score DESC LIMIT 25
  ) m;

  RETURN jsonb_build_object(
    'talent_id', v_talent_id,
    'featured', v_featured,
    'submission_counts', v_submission_counts,
    'my_bids', v_my_bids,
    'my_contracts', v_my_contracts,
    'top_matches', v_top_matches,
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_gigs_hub_dashboard() TO authenticated;


-- ================================================================
-- PHASE G2: place_gig_bid + save_gig SECURITY DEFINER RPCs
-- ================================================================

CREATE OR REPLACE FUNCTION public.place_gig_bid(
  p_gig_id uuid,
  p_bid_amount integer,
  p_cover_letter text DEFAULT NULL,
  p_estimated_days integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_talent_id uuid;
  v_row public.marketplace_bids%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = v_uid LIMIT 1;
  IF v_talent_id IS NULL THEN
    RAISE EXCEPTION 'talent profile required';
  END IF;
  IF p_bid_amount IS NULL OR p_bid_amount < 0 THEN
    RAISE EXCEPTION 'invalid bid amount';
  END IF;

  INSERT INTO public.marketplace_bids(gig_id, talent_id, bid_amount, cover_letter, estimated_days, status)
  VALUES (p_gig_id, v_talent_id, p_bid_amount, p_cover_letter, p_estimated_days, 'submitted')
  ON CONFLICT (gig_id, talent_id) DO UPDATE
    SET bid_amount = EXCLUDED.bid_amount,
        cover_letter = COALESCE(EXCLUDED.cover_letter, public.marketplace_bids.cover_letter),
        estimated_days = COALESCE(EXCLUDED.estimated_days, public.marketplace_bids.estimated_days),
        updated_at = now()
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
EXCEPTION WHEN unique_violation THEN
  -- Fallback if no unique constraint exists; just insert
  INSERT INTO public.marketplace_bids(gig_id, talent_id, bid_amount, cover_letter, estimated_days, status)
  VALUES (p_gig_id, v_talent_id, p_bid_amount, p_cover_letter, p_estimated_days, 'submitted')
  RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_gig_bid(uuid,integer,text,integer) TO authenticated;


CREATE OR REPLACE FUNCTION public.save_gig(p_gig_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_talent_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = v_uid LIMIT 1;
  IF v_talent_id IS NULL THEN RAISE EXCEPTION 'talent profile required'; END IF;

  INSERT INTO public.saved_items(talent_id, item_id, item_type)
  VALUES (v_talent_id, p_gig_id::text, 'gig')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('saved', true, 'gig_id', p_gig_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_gig(uuid) TO authenticated;


-- ================================================================
-- Register tools + bindings
-- ================================================================

INSERT INTO public.agent_tools(tool_key, name, description, category, audience, handler_kind, handler_ref, input_schema, is_active, default_credit_cost)
VALUES
  ('place_gig_bid', 'Place gig bid', 'Submit a marketplace bid on behalf of the talent', 'gig',
    ARRAY['talent']::text[], 'rpc', 'place_gig_bid',
    jsonb_build_object(
      'type','object',
      'required', jsonb_build_array('p_gig_id','p_bid_amount'),
      'properties', jsonb_build_object(
        'p_gig_id', jsonb_build_object('type','string','format','uuid'),
        'p_bid_amount', jsonb_build_object('type','integer','minimum',0),
        'p_cover_letter', jsonb_build_object('type','string'),
        'p_estimated_days', jsonb_build_object('type','integer','minimum',1)
      )
    ), true, 0),
  ('save_gig', 'Save gig', 'Bookmark a gig for the current talent', 'gig',
    ARRAY['talent']::text[], 'rpc', 'save_gig',
    jsonb_build_object(
      'type','object',
      'required', jsonb_build_array('p_gig_id'),
      'properties', jsonb_build_object(
        'p_gig_id', jsonb_build_object('type','string','format','uuid')
      )
    ), true, 0)
ON CONFLICT (tool_key) DO UPDATE
  SET handler_ref = EXCLUDED.handler_ref,
      input_schema = EXCLUDED.input_schema,
      is_active = true,
      updated_at = now();

-- Bind to gig-matchmaker, job-hunter, talent-onboarding
INSERT INTO public.agent_tool_bindings(agent_id, tool_id)
SELECT a.id, t.id
  FROM public.ai_agents a
  CROSS JOIN public.agent_tools t
 WHERE a.agent_key IN ('gig-matchmaker','job-hunter','talent-onboarding')
   AND t.tool_key IN ('place_gig_bid','save_gig')
ON CONFLICT DO NOTHING;
