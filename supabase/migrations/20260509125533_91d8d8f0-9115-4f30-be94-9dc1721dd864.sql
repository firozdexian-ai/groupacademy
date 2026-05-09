INSERT INTO public.agent_tools (tool_key, name, description, category, input_schema, default_credit_cost, min_level, handler_kind, handler_ref, is_active)
VALUES
  (
    'move_application_stage',
    'Move applicant stage',
    'Move a job applicant to a new pipeline stage (submitted, sent_to_employer, viewed, shortlisted, rejected, hired).',
    'company',
    jsonb_build_object(
      'type','object',
      'required', jsonb_build_array('application_id','to_status'),
      'properties', jsonb_build_object(
        'application_id', jsonb_build_object('type','string','description','job_applications.id'),
        'to_status', jsonb_build_object('type','string','enum', jsonb_build_array('submitted','sent_to_employer','viewed','shortlisted','rejected','hired'))
      )
    ),
    0, 1, 'edge_function', 'company-agent-tools', true
  ),
  (
    'accept_gig_bid',
    'Accept gig bid',
    'Accept a freelancer bid on an open gig. Debits company credits, marks gig in_progress, and creates a contract.',
    'company',
    jsonb_build_object(
      'type','object',
      'required', jsonb_build_array('bid_id'),
      'properties', jsonb_build_object(
        'bid_id', jsonb_build_object('type','string','description','gig_bids.id of the winning bid')
      )
    ),
    0, 1, 'edge_function', 'company-agent-tools', true
  )
ON CONFLICT (tool_key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      input_schema = EXCLUDED.input_schema,
      handler_kind = EXCLUDED.handler_kind,
      handler_ref = EXCLUDED.handler_ref,
      is_active = true;

UPDATE public.ai_agents
   SET allowed_tools = (
         SELECT array_agg(DISTINCT t)
         FROM unnest(coalesce(allowed_tools, ARRAY[]::text[]) || ARRAY['move_application_stage']) AS t
       )
 WHERE agent_key IN ('company_recruiter','recruiter');

UPDATE public.ai_agents
   SET allowed_tools = (
         SELECT array_agg(DISTINCT t)
         FROM unnest(coalesce(allowed_tools, ARRAY[]::text[]) || ARRAY['accept_gig_bid']) AS t
       )
 WHERE agent_key IN ('company_ops','ops');