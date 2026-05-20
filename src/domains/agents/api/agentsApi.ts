/**
 * Typed wrappers around agents-domain edge functions (Phase 9c).
 *
 * Convention (locked in Phase 9b):
 *   - One async function per edge function — import by name.
 *   - No `*Api` const, no `<DOMAIN>_EDGE_FUNCTIONS` array.
 *   - Responses validated at runtime via `parseEdgeResponse`.
 *   - Failures throw `EdgeFunctionError`.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AdminSupportAssistantResponseSchema,
  AgentBlueprintResponseSchema,
  AgentEventDispatcherResponseSchema,
  AgentRuntimeResponseSchema,
  AiGeneralChatResponseSchema,
  AiSupportAssistantResponseSchema,
  IngestAgentKnowledgeResponseSchema,
  type AdminSupportAssistantRequest,
  type AdminSupportAssistantResponse,
  type AgentBlueprintRequest,
  type AgentBlueprintResponse,
  type AgentEventDispatcherRequest,
  type AgentEventDispatcherResponse,
  type AgentRuntimeRequest,
  type AgentRuntimeResponse,
  type AiGeneralChatRequest,
  type AiGeneralChatResponse,
  type AiSupportAssistantRequest,
  type AiSupportAssistantResponse,
  type IngestAgentKnowledgeRequest,
  type IngestAgentKnowledgeResponse,
} from "@/edge/contracts/agents";

export async function agentRuntime(
  req: AgentRuntimeRequest,
): Promise<AgentRuntimeResponse> {
  const { data, error } = await supabase.functions.invoke("agent-runtime", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("agent-runtime", error);
  return parseEdgeResponse("agent-runtime", AgentRuntimeResponseSchema, data ?? {});
}

export async function aiGeneralChat(
  req: AiGeneralChatRequest,
): Promise<AiGeneralChatResponse> {
  const { data, error } = await supabase.functions.invoke("ai-general-chat", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-general-chat", error);
  return parseEdgeResponse("ai-general-chat", AiGeneralChatResponseSchema, data ?? {});
}

export async function adminSupportAssistant(
  req: AdminSupportAssistantRequest,
): Promise<AdminSupportAssistantResponse> {
  const { data, error } = await supabase.functions.invoke(
    "admin-support-assistant",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("admin-support-assistant", error);
  return parseEdgeResponse(
    "admin-support-assistant",
    AdminSupportAssistantResponseSchema,
    data ?? {},
  );
}

export async function aiSupportAssistant(
  req: AiSupportAssistantRequest,
): Promise<AiSupportAssistantResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-support-assistant",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-support-assistant", error);
  return parseEdgeResponse(
    "ai-support-assistant",
    AiSupportAssistantResponseSchema,
    data ?? { reply: "" },
  );
}

export async function agentBlueprint(
  req: AgentBlueprintRequest,
): Promise<AgentBlueprintResponse> {
  const { data, error } = await supabase.functions.invoke("agent-blueprint", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("agent-blueprint", error);
  return parseEdgeResponse("agent-blueprint", AgentBlueprintResponseSchema, data ?? {});
}

export async function ingestAgentKnowledge(
  req: IngestAgentKnowledgeRequest,
): Promise<IngestAgentKnowledgeResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ingest-agent-knowledge",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ingest-agent-knowledge", error);
  return parseEdgeResponse(
    "ingest-agent-knowledge",
    IngestAgentKnowledgeResponseSchema,
    data ?? {},
  );
}

export async function agentEventDispatcher(
  req: AgentEventDispatcherRequest = {},
): Promise<AgentEventDispatcherResponse> {
  const { data, error } = await supabase.functions.invoke(
    "agent-event-dispatcher",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("agent-event-dispatcher", error);
  return parseEdgeResponse(
    "agent-event-dispatcher",
    AgentEventDispatcherResponseSchema,
    data ?? {},
  );
}
