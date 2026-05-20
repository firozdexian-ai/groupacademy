/**
 * Edge-function contracts for the agents domain (Phase 9c).
 *
 * Request types mirror what live call sites actually send (preserve
 * runtime behavior). Where a call site sends a body the edge function
 * rejects, the drift is documented in
 * `.lovable/known-edge-contract-drift.md` and the request type still
 * reflects the call site, not the edge function — same precedent as
 * talent contracts (`generate-outreach-message`).
 */
import { z } from "zod";

// agent-runtime --------------------------------------------------------------
export interface AgentRuntimeRequest {
  agent_key?: string;
  thread_id?: string | null;
  message?: string;
  /** WaaS branch: when set, agent-runtime dispatches to a hired instance. */
  instance_id?: string;
  subject_kind?: string;
  subject_id?: string;
  context?: Record<string, unknown>;
  [k: string]: unknown;
}

export const AgentRuntimeResponseSchema = z
  .object({
    reply: z.string().optional(),
    thread_id: z.string().optional(),
    tool_calls: z
      .array(z.object({ name: z.string(), output: z.unknown() }))
      .optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AgentRuntimeResponse = z.infer<typeof AgentRuntimeResponseSchema>;

// ai-general-chat ------------------------------------------------------------
export interface AiGeneralChatRequest {
  message: string;
  thread_id?: string | null;
  context?: Record<string, unknown>;
}

export const AiGeneralChatResponseSchema = z
  .object({
    reply: z.string().optional(),
    thread_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiGeneralChatResponse = z.infer<typeof AiGeneralChatResponseSchema>;

// admin-support-assistant ----------------------------------------------------
/**
 * Fire-and-forget telemetry sink used by various admin/talent pages to
 * report client-side anomalies. Legacy call sites send
 * `{ type, error/event, context }`; the underlying edge function may not
 * exist on disk in all deployments and these calls are expected to fail
 * silently. Wrapper preserves runtime behavior and is documented in
 * `.lovable/known-edge-contract-drift.md`.
 */
export interface AdminSupportAssistantRequest {
  type?: string;
  severity?: string;
  error?: string;
  event?: string;
  context?: string | Record<string, unknown>;
  [k: string]: unknown;
}

export const AdminSupportAssistantResponseSchema = z
  .object({ ok: z.boolean().optional(), error: z.string().optional() })
  .passthrough();
export type AdminSupportAssistantResponse = z.infer<
  typeof AdminSupportAssistantResponseSchema
>;

// ai-support-assistant -------------------------------------------------------
/**
 * Image-OCR-driven CRM support assistant. Canonical body is
 * `{ image, context }` with `image` required.
 */
export interface AiSupportAssistantRequest {
  /** Data URL of the chat screenshot to analyze. */
  image: string;
  /** Optional natural-language context for grounding. */
  context?: string;
}

export const AiSupportAssistantResponseSchema = z
  .object({
    reply: z.string().optional(),
    tone: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
    actions: z.array(z.string()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiSupportAssistantResponse = z.infer<
  typeof AiSupportAssistantResponseSchema
>;

// agent-blueprint ------------------------------------------------------------
export interface AgentBlueprintRequest {
  brief: string;
  audience?: string;
}

export const AgentBlueprintProposalSchema = z.object({
  name: z.string(),
  agent_key: z.string(),
  description: z.string(),
  system_prompt: z.string(),
  allowed_tools: z.array(z.string()),
  agent_level: z.number(),
  connection_fee: z.number(),
  message_credit_cost: z.number(),
  category: z.string(),
  rationale: z.string(),
});
export type AgentBlueprintProposal = z.infer<typeof AgentBlueprintProposalSchema>;

export const AgentBlueprintResponseSchema = z.object({
  proposal: AgentBlueprintProposalSchema.optional(),
  error: z.string().optional(),
});
export type AgentBlueprintResponse = z.infer<typeof AgentBlueprintResponseSchema>;

// ingest-agent-knowledge -----------------------------------------------------
/**
 * NOTE: Call site (`AgentStudioTab.tsx`) sends `{ source_type, url }` but the
 * edge function expects `{ source_kind, source_ref }` — this wrapper preserves
 * the call-site shape so existing callers compile, drift is documented.
 */
export interface IngestAgentKnowledgeRequest {
  agent_id: string;
  source_type: "text" | "url" | "file";
  title: string;
  content?: string;
  url?: string;
}

export const IngestAgentKnowledgeResponseSchema = z.object({
  ok: z.boolean().optional(),
  source_id: z.string().optional(),
  chunks: z.number().optional(),
  error: z.string().optional(),
});
export type IngestAgentKnowledgeResponse = z.infer<
  typeof IngestAgentKnowledgeResponseSchema
>;

// agent-event-dispatcher -----------------------------------------------------
export interface AgentEventDispatcherRequest {
  /** Cron sweep takes an empty body. Future overrides may pass filters. */
  filters?: Record<string, unknown>;
}

export const AgentEventDispatcherResponseSchema = z.object({
  events: z.number().optional(),
  dispatched: z.number().optional(),
  error: z.string().optional(),
});
export type AgentEventDispatcherResponse = z.infer<
  typeof AgentEventDispatcherResponseSchema
>;
