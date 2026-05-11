ALTER TABLE public.workforce_routing_rules
  ADD COLUMN IF NOT EXISTS audience_type text;

ALTER TABLE public.workforce_routing_rules
  DROP CONSTRAINT IF EXISTS workforce_routing_rules_audience_type_check;

ALTER TABLE public.workforce_routing_rules
  ADD CONSTRAINT workforce_routing_rules_audience_type_check
  CHECK (audience_type IS NULL OR audience_type IN ('admin','talent','business','system'));

CREATE INDEX IF NOT EXISTS idx_workforce_routing_match
  ON public.workforce_routing_rules (event_topic, audience_type, agent_key)
  WHERE is_active = true;

INSERT INTO public.agent_tools (
  tool_key, name, description, category, audience,
  min_level, default_credit_cost, handler_kind, handler_ref,
  input_schema, is_active, status
) VALUES (
  'notify_stakeholder',
  'Notify Stakeholder',
  'Sends an urgent alert or notification to a specific stakeholder audience (admin, business, talent). Used for escalations, lead captures, or critical pulse events.',
  'utility',
  ARRAY['talent','company','admin'],
  1,
  1,
  'edge_function',
  'notify-stakeholder',
  jsonb_build_object(
    'type','object',
    'required', jsonb_build_array('audience_type','event_topic','message'),
    'properties', jsonb_build_object(
      'audience_type', jsonb_build_object('type','string','enum', jsonb_build_array('admin','talent','business','system')),
      'event_topic',   jsonb_build_object('type','string','description','Event topic such as onboarding, transactions, alerts, or * for catch-all'),
      'message',       jsonb_build_object('type','string','description','Notification body — keep under 1500 chars'),
      'title',         jsonb_build_object('type','string','description','Optional short headline'),
      'metadata',      jsonb_build_object('type','object','description','Optional structured context')
    )
  ),
  true,
  'available'
)
ON CONFLICT (tool_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    handler_kind = EXCLUDED.handler_kind,
    handler_ref = EXCLUDED.handler_ref,
    input_schema = EXCLUDED.input_schema,
    is_active = true,
    status = 'available';