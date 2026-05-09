-- Fix Phase Z0 / D1 misregistration: archive_expired_jobs was inserted with
-- status='active' (dispatcher requires 'available') and bound to non-existent
-- agent_key 'ops' (should be 'gig-ops'). Repair both so the Admin AI can see
-- and execute the tool.
UPDATE public.agent_tools
   SET status = 'available', is_active = true
 WHERE tool_key = 'archive_expired_jobs';

INSERT INTO public.agent_tool_bindings (agent_id, tool_id)
SELECT a.id, t.id
  FROM public.ai_agents a
  JOIN public.agent_tools t ON t.tool_key = 'archive_expired_jobs'
 WHERE a.agent_key IN ('gig-ops','fin-controller')
ON CONFLICT (agent_id, tool_id) DO NOTHING;