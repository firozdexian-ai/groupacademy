
INSERT INTO public.agent_tools (tool_key, name, description, category, audience, handler_kind, handler_ref, input_schema, is_active, status)
VALUES (
  'archive_expired_jobs',
  'Archive Expired Jobs',
  'Bulk-archive jobs past their application deadline (or inactive-stale jobs older than 90 days). Returns the number of archived jobs.',
  'admin_ops',
  ARRAY['admin']::text[],
  'edge_function',
  'admin-agent-tools',
  '{"type":"object","properties":{},"additionalProperties":false}'::jsonb,
  true,
  'active'
)
ON CONFLICT (tool_key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      audience = EXCLUDED.audience,
      handler_kind = EXCLUDED.handler_kind,
      handler_ref = EXCLUDED.handler_ref,
      input_schema = EXCLUDED.input_schema,
      is_active = true,
      status = 'active';

INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id
  FROM public.ai_agents a
  JOIN public.agent_tools t ON t.tool_key = 'archive_expired_jobs'
 WHERE a.agent_key = 'ops'
ON CONFLICT (agent_id, tool_id) DO NOTHING;
