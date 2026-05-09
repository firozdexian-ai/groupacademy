CREATE OR REPLACE FUNCTION public.get_gigs_hub_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_talent_id uuid;
  v_featured jsonb;
  v_my_bids jsonb;
  v_my_contracts jsonb;
  v_submission_counts jsonb;
  v_top_matches jsonb;
  v_course_projects jsonb;
  v_market_projects jsonb;
BEGIN
  SELECT id INTO v_talent_id FROM public.talents WHERE user_id = v_uid LIMIT 1;

  SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.display_order NULLS LAST), '[]'::jsonb)
    INTO v_featured
  FROM (
    SELECT id, title, description, category, credit_reward, icon, display_order, requirements, is_active
      FROM public.gigs WHERE is_active = true
     ORDER BY display_order NULLS LAST LIMIT 24
  ) g;

  SELECT COALESCE(jsonb_object_agg(gig_id::text, jsonb_build_object('total', total, 'pending', pending)), '{}'::jsonb)
    INTO v_submission_counts
  FROM (
    SELECT gig_id,
           count(*)::int AS total,
           count(*) FILTER (WHERE status='pending')::int AS pending
      FROM public.gig_submissions
     WHERE v_talent_id IS NOT NULL AND talent_id = v_talent_id
     GROUP BY gig_id
  ) s;

  SELECT COALESCE(jsonb_agg(b ORDER BY b->>'created_at' DESC), '[]'::jsonb)
    INTO v_my_bids
  FROM (
    SELECT jsonb_build_object(
      'id', b.id, 'gig_id', b.gig_id, 'bid_amount', b.bid_amount,
      'status', b.status, 'created_at', b.created_at,
      'marketplace_gigs', jsonb_build_object(
        'title', mg.title, 'skill_category', mg.skill_category, 'employer_name', mg.employer_name
      )
    ) AS b
      FROM public.marketplace_bids b
      LEFT JOIN public.marketplace_gigs mg ON mg.id = b.gig_id
     WHERE v_talent_id IS NOT NULL AND b.talent_id = v_talent_id
     ORDER BY b.created_at DESC LIMIT 50
  ) x;

  SELECT COALESCE(jsonb_agg(c ORDER BY c->>'created_at' DESC), '[]'::jsonb)
    INTO v_my_contracts
  FROM (
    SELECT jsonb_build_object(
      'id', c.id, 'gig_id', c.gig_id, 'agreed_amount', c.agreed_amount,
      'status', c.status, 'created_at', c.created_at,
      'marketplace_gigs', jsonb_build_object('title', mg.title, 'skill_category', mg.skill_category)
    ) AS c
      FROM public.marketplace_contracts c
      LEFT JOIN public.marketplace_gigs mg ON mg.id = c.gig_id
     WHERE v_talent_id IS NOT NULL AND c.freelancer_id = v_talent_id
     ORDER BY c.created_at DESC LIMIT 50
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.score DESC), '[]'::jsonb)
    INTO v_top_matches
  FROM (
    SELECT id AS match_id, gig_id, gig_kind, score, why_text, status, expires_at
      FROM public.gig_matches
     WHERE v_talent_id IS NOT NULL AND talent_id = v_talent_id
       AND status IN ('offered','viewed')
     ORDER BY score DESC LIMIT 25
  ) m;

  SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
    INTO v_course_projects
  FROM (
    SELECT jsonb_build_object(
      'projectId', cp.id,
      'status', cp.status,
      'totalReward', COALESCE(cp.total_credit_reward, 0),
      'created_at', cp.created_at,
      'subtasks', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', s.id))
                              FROM public.course_project_subtasks s
                             WHERE s.project_id = cp.id), '[]'::jsonb),
      'course', jsonb_build_object(
        'id', c.id, 'title', COALESCE(c.title,'Untitled course'), 'cover_image_url', c.cover_image_url
      )
    ) AS p
      FROM public.course_projects cp
      LEFT JOIN public.content c ON c.id = cp.course_id
     WHERE cp.status IN ('open','claimed','in_progress')
     ORDER BY cp.created_at DESC LIMIT 60
  ) x;

  SELECT COALESCE(jsonb_agg(m), '[]'::jsonb)
    INTO v_market_projects
  FROM (
    SELECT jsonb_build_object(
      'id', mg.id, 'title', mg.title, 'description', mg.description,
      'skill_category', mg.skill_category, 'budget_amount', mg.budget_amount,
      'total_bids', COALESCE(mg.total_bids,0), 'is_featured', COALESCE(mg.is_featured,false),
      'employer_name', mg.employer_name, 'created_at', mg.created_at
    ) AS m
      FROM public.marketplace_gigs mg
     WHERE mg.status IN ('approved','active')
     ORDER BY mg.is_featured DESC NULLS LAST, mg.created_at DESC LIMIT 50
  ) x;

  RETURN jsonb_build_object(
    'talent_id', v_talent_id,
    'featured', v_featured,
    'submission_counts', v_submission_counts,
    'my_bids', v_my_bids,
    'my_contracts', v_my_contracts,
    'top_matches', v_top_matches,
    'course_projects', v_course_projects,
    'marketplace_projects', v_market_projects,
    'generated_at', now()
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_gigs_hub_dashboard() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_ranked_gigs_for_talent(
  _talent_id uuid,
  _cursor numeric DEFAULT NULL,
  _limit int DEFAULT 12
)
RETURNS TABLE (
  gig_id uuid,
  kind text,
  title text,
  description text,
  skill_category text,
  credits int,
  deadline timestamptz,
  status text,
  created_at timestamptz,
  rank_score numeric,
  match_score numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id AS gig_id,
    g.kind,
    g.title,
    g.description,
    g.skill_category,
    g.credits,
    g.deadline,
    g.status,
    g.created_at,
    EXTRACT(EPOCH FROM g.created_at)::numeric AS rank_score,
    COALESCE((SELECT max(m.score) FROM public.gig_matches m
               WHERE _talent_id IS NOT NULL
                 AND m.talent_id = _talent_id
                 AND m.gig_id = g.id), 0)::numeric AS match_score
  FROM public.gigs_unified_view g
  WHERE g.status IN ('open','active','approved','published')
    AND (_cursor IS NULL OR EXTRACT(EPOCH FROM g.created_at)::numeric < _cursor)
  ORDER BY g.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 50));
$$;

GRANT EXECUTE ON FUNCTION public.get_ranked_gigs_for_talent(uuid, numeric, int) TO authenticated, anon;