
-- RPCs (idempotent CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.add_portfolio_item(
  p_title text, p_description text DEFAULT NULL, p_url text DEFAULT NULL,
  p_image_url text DEFAULT NULL, p_tags text[] DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_item jsonb;
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthorized'); END IF;
  IF coalesce(trim(p_title),'')='' THEN RETURN jsonb_build_object('ok',false,'error','title_required'); END IF;
  v_item := jsonb_build_object('id',gen_random_uuid(),'title',p_title,'description',p_description,
    'url',p_url,'image_url',p_image_url,'tags',to_jsonb(coalesce(p_tags,ARRAY[]::text[])),
    'added_at',to_jsonb(now()));
  UPDATE public.talents
     SET projects = coalesce(projects,'[]'::jsonb) || jsonb_build_array(v_item), updated_at = now()
   WHERE user_id = v_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','no_talent_profile'); END IF;
  RETURN jsonb_build_object('ok',true,'item',v_item);
END $$;

CREATE OR REPLACE FUNCTION public.set_skill_level(p_skill text, p_level text DEFAULT 'intermediate')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_existing jsonb; v_filtered jsonb; v_new jsonb;
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthorized'); END IF;
  IF coalesce(trim(p_skill),'')='' THEN RETURN jsonb_build_object('ok',false,'error','skill_required'); END IF;
  IF p_level NOT IN ('beginner','intermediate','advanced','expert') THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_level'); END IF;
  SELECT skills INTO v_existing FROM public.talents WHERE user_id = v_user_id;
  IF v_existing IS NULL OR jsonb_typeof(v_existing) <> 'array' THEN v_existing := '[]'::jsonb; END IF;
  SELECT coalesce(jsonb_agg(elem),'[]'::jsonb) INTO v_filtered FROM jsonb_array_elements(v_existing) elem
   WHERE lower(coalesce(CASE WHEN jsonb_typeof(elem)='object' THEN elem->>'name' ELSE elem #>> '{}' END,'')) <> lower(p_skill);
  v_new := jsonb_build_object('name',p_skill,'level',p_level,'updated_at',to_jsonb(now()));
  UPDATE public.talents SET skills = v_filtered || jsonb_build_array(v_new), updated_at = now()
   WHERE user_id = v_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','no_talent_profile'); END IF;
  RETURN jsonb_build_object('ok',true,'skill',v_new);
END $$;

CREATE OR REPLACE FUNCTION public.award_credits(p_talent_id uuid, p_amount numeric, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller uuid := auth.uid(); v_is_admin boolean := false; v_next numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('ok',false,'error','invalid_amount'); END IF;
  IF p_talent_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','talent_required'); END IF;
  IF v_caller IS NOT NULL THEN
    SELECT public.has_role(v_caller,'admin'::app_role) INTO v_is_admin;
    IF NOT v_is_admin THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  END IF;
  INSERT INTO public.talent_credits (talent_id, balance, earned_balance) VALUES (p_talent_id,0,0)
    ON CONFLICT (talent_id) DO NOTHING;
  UPDATE public.talent_credits
     SET balance = coalesce(balance,0) + p_amount,
         earned_balance = coalesce(earned_balance,0) + p_amount,
         updated_at = now()
   WHERE talent_id = p_talent_id RETURNING balance INTO v_next;
  INSERT INTO public.credit_transactions (talent_id, amount, balance_after, transaction_type,
    service_type, description, is_earned, source)
   VALUES (p_talent_id, p_amount, v_next, 'award', 'agent_award',
    coalesce(p_reason,'Agent award'), true, 'agent');
  RETURN jsonb_build_object('ok',true,'balance',v_next,'awarded',p_amount);
END $$;

CREATE OR REPLACE FUNCTION public.compose_feed_post(
  p_text text, p_media_url text DEFAULT NULL, p_link_url text DEFAULT NULL, p_tags text[] DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_talent record; v_post_id uuid; v_ctype post_content_type;
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthorized'); END IF;
  IF coalesce(trim(p_text),'')='' THEN RETURN jsonb_build_object('ok',false,'error','text_required'); END IF;
  SELECT id, full_name, profile_photo_url, custom_profession INTO v_talent
    FROM public.talents WHERE user_id = v_user_id;
  IF v_talent.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','no_talent_profile'); END IF;
  v_ctype := CASE WHEN p_media_url IS NOT NULL THEN 'media'::post_content_type ELSE 'text'::post_content_type END;
  INSERT INTO public.feed_posts (author_user_id, author_type, talent_id, author_name, author_avatar,
    author_title, content_type, text_content, media_url, link_url, tags, audience, status, is_active)
   VALUES (v_user_id,'talent',v_talent.id,v_talent.full_name,v_talent.profile_photo_url,
    v_talent.custom_profession, v_ctype, p_text, p_media_url, p_link_url,
    coalesce(p_tags,ARRAY[]::text[]),'public','published',true)
   RETURNING id INTO v_post_id;
  RETURN jsonb_build_object('ok',true,'post_id',v_post_id);
END $$;

CREATE OR REPLACE FUNCTION public.create_poll(
  p_question text, p_options jsonb, p_ends_at timestamptz DEFAULT NULL, p_tags text[] DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_talent record; v_post_id uuid; v_opts jsonb;
BEGIN
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthorized'); END IF;
  IF coalesce(trim(p_question),'')='' THEN RETURN jsonb_build_object('ok',false,'error','question_required'); END IF;
  IF p_options IS NULL OR jsonb_typeof(p_options) <> 'array' OR jsonb_array_length(p_options) < 2 THEN
    RETURN jsonb_build_object('ok',false,'error','need_two_options'); END IF;
  SELECT id, full_name, profile_photo_url, custom_profession INTO v_talent
    FROM public.talents WHERE user_id = v_user_id;
  IF v_talent.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','no_talent_profile'); END IF;
  SELECT jsonb_agg(jsonb_build_object('id',gen_random_uuid(),
           'label', CASE WHEN jsonb_typeof(o)='object' THEN o->>'label' ELSE o #>> '{}' END,
           'votes', 0))
    INTO v_opts FROM jsonb_array_elements(p_options) o;
  INSERT INTO public.feed_posts (author_user_id, author_type, talent_id, author_name, author_avatar,
    author_title, content_type, text_content, poll_options, poll_ends_at, tags,
    audience, status, is_active)
   VALUES (v_user_id,'talent',v_talent.id,v_talent.full_name,v_talent.profile_photo_url,
    v_talent.custom_profession,'poll'::post_content_type, p_question, v_opts,
    coalesce(p_ends_at, now() + interval '7 days'),
    coalesce(p_tags,ARRAY[]::text[]),'public','published',true)
   RETURNING id INTO v_post_id;
  RETURN jsonb_build_object('ok',true,'post_id',v_post_id,'options',v_opts);
END $$;

-- Tool registry (min_level capped at 3 per check constraint)
INSERT INTO public.agent_tools (tool_key, name, description, category, audience, min_level, default_credit_cost, handler_kind, handler_ref, input_schema, status) VALUES
  ('profile.write','Write Profile Field','Save a single profile field (full_name|phone|skills) for the talent.','profile',ARRAY['talent','admin'],1,0,'rpc','update_talent_profile',
    jsonb_build_object('type','object','required',jsonb_build_array('field','value'),'properties',jsonb_build_object(
      'field',jsonb_build_object('type','string','enum',jsonb_build_array('full_name','phone','skills')),
      'value',jsonb_build_object('type','string'))),'available'),
  ('add_portfolio_item','Add Portfolio Item','Append a project to the talent portfolio.','profile',ARRAY['talent','admin'],1,0,'rpc','add_portfolio_item',
    jsonb_build_object('type','object','required',jsonb_build_array('title'),'properties',jsonb_build_object(
      'title',jsonb_build_object('type','string'),'description',jsonb_build_object('type','string'),
      'url',jsonb_build_object('type','string'),'image_url',jsonb_build_object('type','string'),
      'tags',jsonb_build_object('type','array','items',jsonb_build_object('type','string')))),'available'),
  ('set_skill_level','Set Skill Level','Upsert a skill with proficiency level.','profile',ARRAY['talent','admin'],1,0,'rpc','set_skill_level',
    jsonb_build_object('type','object','required',jsonb_build_array('skill'),'properties',jsonb_build_object(
      'skill',jsonb_build_object('type','string'),
      'level',jsonb_build_object('type','string','enum',jsonb_build_array('beginner','intermediate','advanced','expert')))),'available'),
  ('compose_feed_post','Compose Feed Post','Publish a text/media post to the community feed.','social',ARRAY['talent','admin'],1,0,'rpc','compose_feed_post',
    jsonb_build_object('type','object','required',jsonb_build_array('text'),'properties',jsonb_build_object(
      'text',jsonb_build_object('type','string'),'media_url',jsonb_build_object('type','string'),
      'link_url',jsonb_build_object('type','string'),
      'tags',jsonb_build_object('type','array','items',jsonb_build_object('type','string')))),'available'),
  ('create_poll','Create Poll','Publish a poll post with options and a deadline.','social',ARRAY['talent','admin'],1,0,'rpc','create_poll',
    jsonb_build_object('type','object','required',jsonb_build_array('question','options'),'properties',jsonb_build_object(
      'question',jsonb_build_object('type','string'),
      'options',jsonb_build_object('type','array','items',jsonb_build_object('type','string'),'minItems',2),
      'ends_at',jsonb_build_object('type','string','format','date-time'),
      'tags',jsonb_build_object('type','array','items',jsonb_build_object('type','string')))),'available'),
  ('award_credits','Award Credits','Grant earned credits to a talent. Admin/service only.','utility',ARRAY['admin'],3,0,'rpc','award_credits',
    jsonb_build_object('type','object','required',jsonb_build_array('talent_id','amount','reason'),'properties',jsonb_build_object(
      'talent_id',jsonb_build_object('type','string','format','uuid'),
      'amount',jsonb_build_object('type','number','minimum',0.1),
      'reason',jsonb_build_object('type','string'))),'available'),
  ('notify_admin','Notify Admin','Send an alert to the admin team via Telegram.','utility',ARRAY['talent','company','admin'],1,0,'edge_function','notify-admin',
    jsonb_build_object('type','object','required',jsonb_build_array('message'),'properties',jsonb_build_object(
      'channel',jsonb_build_object('type','string','enum',jsonb_build_array('telegram')),
      'message',jsonb_build_object('type','string'))),'available')
ON CONFLICT (tool_key) DO UPDATE SET
  name=EXCLUDED.name, description=EXCLUDED.description, category=EXCLUDED.category,
  audience=EXCLUDED.audience, min_level=EXCLUDED.min_level, handler_kind=EXCLUDED.handler_kind,
  handler_ref=EXCLUDED.handler_ref, input_schema=EXCLUDED.input_schema, status=EXCLUDED.status,
  updated_at=now();

-- Bindings
INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE (a.agent_key='talent-onboarding' OR a.agent_key LIKE 'instructor:%')
   AND t.tool_key IN ('profile.write','add_portfolio_item','set_skill_level')
ON CONFLICT DO NOTHING;

INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key='community-engine'
   AND t.tool_key IN ('compose_feed_post','create_poll')
ON CONFLICT DO NOTHING;

INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key IN ('talent-onboarding','community-engine','ai-general')
   AND t.tool_key='notify_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id FROM public.ai_agents a CROSS JOIN public.agent_tools t
 WHERE a.agent_key LIKE 'admin-%' AND t.tool_key='award_credits'
ON CONFLICT DO NOTHING;

-- Mirror bindings into ai_agents.allowed_tools for runtime discovery
UPDATE public.ai_agents a
   SET allowed_tools = COALESCE((
        SELECT array_agg(DISTINCT t.tool_key)
          FROM public.agent_tool_bindings b
          JOIN public.agent_tools t ON t.id = b.tool_id
         WHERE b.agent_id = a.id), a.allowed_tools)
 WHERE a.id IN (SELECT DISTINCT agent_id FROM public.agent_tool_bindings);
