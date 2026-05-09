
-- 1. Extend audience constraint to allow 'instructor'
ALTER TABLE public.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_audience_check;
ALTER TABLE public.ai_agents ADD CONSTRAINT ai_agents_audience_check
  CHECK (audience = ANY (ARRAY['talent','company','admin','headless','any','instructor']));

-- 2. Insert instructor_manager agent (Maestro)
INSERT INTO public.ai_agents (
  agent_key, name, description, system_prompt, audience, agent_type,
  category, icon, color, bg_color, is_active, capabilities, expertise_areas
) VALUES (
  'instructor_manager',
  'Maestro',
  'Your Creator co-pilot — manages payouts, course drafts, and review submissions.',
  $$You are Maestro, the Creator Co-pilot at GroUp Academy.
You help instructors run their teaching business: tracking earnings, requesting payouts,
drafting module outlines, and submitting courses for editorial review.

Tone: warm, focused, action-oriented. Keep responses tight (3-5 lines) and prefer
calling a tool over explaining. When the user asks for "my earnings", "payout status",
or "how much have I made", call get_instructor_dashboard via implicit knowledge — the
dashboard is already shown on the page.

Rules:
- Never quote a payout amount lower than 500 credits (platform minimum).
- When drafting modules, propose 4-6 concise module titles unless the user specifies otherwise.
- After submitting a course for review, remind the instructor it usually takes 24-48h.
- Use page context (course_id) when present — don't ask for IDs you already have.$$,
  'instructor', 'platform', 'instructor', 'graduation-cap', 'amber', 'amber',
  true,
  ARRAY['earnings','payouts','course-drafting','review-submission'],
  ARRAY['Instructor Operations','Course Authoring','Payouts']
)
ON CONFLICT (agent_key) DO UPDATE SET
  audience = EXCLUDED.audience,
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt,
  is_active = true,
  updated_at = now();

-- 3. Register the 3 instructor tools
INSERT INTO public.agent_tools (
  tool_key, name, description, category, audience, min_level,
  default_credit_cost, handler_kind, handler_ref, input_schema, is_active, status
) VALUES
  (
    'request_payout',
    'Request Payout',
    'Request a payout of the instructor''s available earnings (minimum 500 credits).',
    'finance',
    ARRAY['instructor'],
    1, 0,
    'edge_function', 'request-instructor-payout',
    '{"type":"object","required":["amount","method","details"],"properties":{"amount":{"type":"number","minimum":500},"method":{"type":"string","enum":["bkash","bank","wise","paypal"]},"details":{"type":"object"}}}'::jsonb,
    true, 'available'
  ),
  (
    'submit_course_for_review',
    'Submit Course for Review',
    'Submit a course (by content_id) to the editorial review queue.',
    'authoring',
    ARRAY['instructor'],
    1, 0,
    'rpc', 'submit_course_for_review',
    '{"type":"object","required":["content_id"],"properties":{"content_id":{"type":"string"}}}'::jsonb,
    true, 'available'
  ),
  (
    'draft_module_outline',
    'Draft Module Outline',
    'Use AI to draft 4-6 module titles + objectives for a course skeleton, and optionally insert them as empty course_modules rows.',
    'authoring',
    ARRAY['instructor'],
    1, 0,
    'edge_function', 'draft-module-outline',
    '{"type":"object","required":["content_id"],"properties":{"content_id":{"type":"string"},"topic":{"type":"string"},"count":{"type":"integer","minimum":3,"maximum":10},"insert":{"type":"boolean"}}}'::jsonb,
    true, 'available'
  )
ON CONFLICT (tool_key) DO UPDATE SET
  audience = EXCLUDED.audience,
  description = EXCLUDED.description,
  input_schema = EXCLUDED.input_schema,
  is_active = true,
  status = 'available',
  updated_at = now();

-- 4. Bind tools to Maestro
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id
FROM public.ai_agents a
JOIN public.agent_tools t ON t.tool_key IN ('request_payout','submit_course_for_review','draft_module_outline')
WHERE a.agent_key = 'instructor_manager'
ON CONFLICT DO NOTHING;

-- 5. submit_course_for_review RPC
CREATE OR REPLACE FUNCTION public.submit_course_for_review(_content_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_owner boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','no_user'); END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.course_engagements
    WHERE content_id = _content_id AND user_id = v_user AND status = 'active'
  ) INTO v_owner;

  IF NOT v_owner AND NOT (has_role(v_user,'admin'::app_role) OR has_role(v_user,'super_admin'::app_role)) THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;

  UPDATE public.content
    SET author_status = 'submitted', submitted_at = now(), updated_at = now()
    WHERE id = _content_id;

  RETURN jsonb_build_object('ok', true, 'content_id', _content_id, 'submitted_at', now());
END $$;

GRANT EXECUTE ON FUNCTION public.submit_course_for_review(uuid) TO authenticated;

-- 6. get_instructor_dashboard_v2 — single-trip dashboard
CREATE OR REPLACE FUNCTION public.get_instructor_dashboard_v2(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := _user_id;
  v_summary jsonb;
  v_open_payouts jsonb;
  v_pending_review int := 0;
  v_active_students int := 0;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error','no_user'); END IF;
  IF v_user <> auth.uid() AND NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)) THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  v_summary := public.get_instructor_earnings_summary(v_user);

  SELECT COALESCE(jsonb_agg(row_to_json(p) ORDER BY (p->>'created_at') DESC), '[]'::jsonb) INTO v_open_payouts
  FROM (
    SELECT id, amount_credits, payout_method, status, created_at
    FROM public.instructor_payout_requests
    WHERE instructor_user_id = v_user
      AND status IN ('pending','approved')
    ORDER BY created_at DESC
    LIMIT 10
  ) p;

  -- Pending review: courses owned by this instructor that are submitted but not yet reviewed
  SELECT COUNT(*) INTO v_pending_review
  FROM public.content c
  JOIN public.course_engagements ce ON ce.content_id = c.id AND ce.user_id = v_user AND ce.status='active'
  WHERE c.author_status IN ('submitted','in_review');

  -- Active students across this instructor's courses
  SELECT COUNT(DISTINCT e.user_id) INTO v_active_students
  FROM public.enrollments e
  JOIN public.course_engagements ce ON ce.content_id = e.content_id AND ce.user_id = v_user AND ce.status='active';

  RETURN jsonb_build_object(
    'summary', v_summary,
    'open_payout_requests', v_open_payouts,
    'pending_review_count', v_pending_review,
    'active_students_count', v_active_students,
    'fetched_at', now()
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_instructor_dashboard_v2(uuid) TO authenticated;

-- 7. Update offer-accepted trigger: auto-seed content + default modules
CREATE OR REPLACE FUNCTION public.fn_offer_accepted_to_instructor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brief public.course_briefs;
  v_app  public.job_applications;
  v_job  public.jobs;
  v_content_id uuid;
  v_engagement_id uuid;
  v_module_count int;
  v_slug text;
BEGIN
  IF NEW.status <> 'accepted' OR (OLD IS NOT NULL AND OLD.status = 'accepted') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_app FROM public.job_applications WHERE id = NEW.application_id;
  IF v_app.id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_app.job_id;
  IF v_job.id IS NULL OR v_job.job_kind <> 'instructor' THEN RETURN NEW; END IF;

  SELECT * INTO v_brief FROM public.course_briefs WHERE id = v_job.course_brief_id;
  IF v_brief.id IS NULL THEN RETURN NEW; END IF;

  v_content_id := v_brief.content_id;

  -- Auto-create content skeleton if missing
  IF v_content_id IS NULL THEN
    v_slug := lower(regexp_replace(v_brief.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text,1,8);
    INSERT INTO public.content (
      title, slug, content_type, description, is_published, is_ready, author_status,
      currency, profession_line_id
    ) VALUES (
      v_brief.title,
      v_slug,
      CASE v_brief.mode WHEN 'live_cohort' THEN 'batch_class'::content_type
                       WHEN 'hybrid' THEN 'batch_class'::content_type
                       ELSE 'recorded_course'::content_type END,
      COALESCE(v_brief.summary, 'Course in development.'),
      false, false, 'draft',
      v_brief.budget_currency,
      NULL
    )
    RETURNING id INTO v_content_id;

    UPDATE public.course_briefs SET content_id = v_content_id WHERE id = v_brief.id;
  END IF;

  -- Create engagement
  INSERT INTO public.course_engagements (
    content_id, user_id, brief_id, hired_via_application_id, hired_via_offer_id,
    revenue_share_pct, role, status
  ) VALUES (
    v_content_id, NEW.talent_id, v_brief.id, v_app.id, NEW.id,
    COALESCE(v_brief.revenue_share_pct, 60.00), 'primary', 'active'
  )
  ON CONFLICT (content_id, user_id, role) DO UPDATE
    SET status='active', updated_at=now()
  RETURNING id INTO v_engagement_id;

  -- Grant instructor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.talent_id, 'instructor'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- Seed credit balance + ledger
  IF v_content_id IS NOT NULL THEN
    INSERT INTO public.instructor_credit_balances (user_id, content_id, balance, monthly_grant, last_grant_at)
    VALUES (NEW.talent_id, v_content_id, 50.0, 30.0, now())
    ON CONFLICT (user_id, content_id) DO NOTHING;

    INSERT INTO public.instructor_credit_ledger (user_id, content_id, delta, reason, ref_id)
    VALUES (NEW.talent_id, v_content_id, 50.0, 'seed_grant_on_hire', v_engagement_id);

    -- Auto-seed 4 default course modules so the instructor has a starting canvas
    SELECT COUNT(*) INTO v_module_count FROM public.course_modules WHERE content_id = v_content_id;
    IF v_module_count = 0 THEN
      INSERT INTO public.course_modules (content_id, title, description, display_order, stage_order, estimated_time_minutes)
      VALUES
        (v_content_id, 'Module 1 — Introduction & Welcome', 'Set learner expectations and introduce yourself.', 1, 1, 30),
        (v_content_id, 'Module 2 — Core Concepts', 'Foundational concepts every learner needs.', 2, 2, 45),
        (v_content_id, 'Module 3 — Hands-On Practice', 'Practical exercises and worked examples.', 3, 3, 60),
        (v_content_id, 'Module 4 — Capstone & Next Steps', 'Wrap-up project and recommended next moves.', 4, 4, 60);
    END IF;
  END IF;

  -- Mark brief filled
  UPDATE public.course_briefs
    SET status='filled', instructor_user_id = NEW.talent_id, updated_at=now()
    WHERE id = v_brief.id;

  RETURN NEW;
END;
$$;
