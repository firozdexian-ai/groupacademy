/**
 * Group Academy — Agents Domain API Layer
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Integration Map: Typed wrappers enforcing contract validation for Deno Edge Runtimes.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import { trackError } from "@/lib/errorTracking";
import {
  AdminSupportAssistantResponseSchema,
  AgentBlueprintResponseSchema,
  AgentEventDispatcherResponseSchema,
  AgentRuntimeResponseSchema,
  AiGeneralChatResponseSchema,
  AiSupportAssistantResponseSchema,
  CompanyAgentToolsResponseSchema,
  IngestAgentKnowledgeResponseSchema,
  TriggerAgentPitchResponseSchema,
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
  type CompanyAgentToolsRequest,
  type CompanyAgentToolsResponse,
  type IngestAgentKnowledgeRequest,
  type IngestAgentKnowledgeResponse,
  type TriggerAgentPitchRequest,
  type TriggerAgentPitchResponse,
} from "@/edge/contracts/agents";

async function invokeAgentEdge<TRequest, TResponse>(
  functionName: string,
  schema: any,
  req: TRequest,
): Promise<TResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body: req });
    if (error) throw new EdgeFunctionError(functionName, error);
    return parseEdgeResponse(functionName, schema, data ?? {});
  } catch (err: any) {
    trackError(`agents-api-${functionName}-failure`, { error: err.message, payload: req });
    throw err;
  }
}

export async function agentRuntime(req: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
  return invokeAgentEdge("agent-runtime", AgentRuntimeResponseSchema, req);
}

export async function aiGeneralChat(req: AiGeneralChatRequest): Promise<AiGeneralChatResponse> {
  return invokeAgentEdge("ai-general-chat", AiGeneralChatResponseSchema, req);
}

export async function adminSupportAssistant(req: AdminSupportAssistantRequest): Promise<AdminSupportAssistantResponse> {
  return invokeAgentEdge("admin-support-assistant", AdminSupportAssistantResponseSchema, req);
}

export async function aiSupportAssistant(req: AiSupportAssistantRequest): Promise<AiSupportAssistantResponse> {
  return invokeAgentEdge("ai-support-assistant", AiSupportAssistantResponseSchema, req);
}

export async function agentBlueprint(req: AgentBlueprintRequest): Promise<AgentBlueprintResponse> {
  return invokeAgentEdge("agent-blueprint", AgentBlueprintResponseSchema, req);
}

export async function ingestAgentKnowledge(req: IngestAgentKnowledgeRequest): Promise<IngestAgentKnowledgeResponse> {
  return invokeAgentEdge("ingest-agent-knowledge", IngestAgentKnowledgeResponseSchema, req);
}

export async function agentEventDispatcher(
  req: AgentEventDispatcherRequest = {},
): Promise<AgentEventDispatcherResponse> {
  return invokeAgentEdge("agent-event-dispatcher", AgentEventDispatcherResponseSchema, req);
}

export async function companyAgentTools(req: CompanyAgentToolsRequest): Promise<CompanyAgentToolsResponse> {
  return invokeAgentEdge("company-agent-tools", CompanyAgentToolsResponseSchema, req);
}

export async function triggerAgentPitch(req: TriggerAgentPitchRequest): Promise<TriggerAgentPitchResponse> {
  return invokeAgentEdge("trigger-agent-pitch", TriggerAgentPitchResponseSchema, req);
}
