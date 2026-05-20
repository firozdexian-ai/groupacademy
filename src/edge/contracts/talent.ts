/**
 * Edge-function contracts for the talent domain.
 *
 * Response bodies are `Record<string, unknown>` until Phase 9 hardens
 * the wire shape — matches the marketing/jobs contract pattern.
 */

// batch-parse-cvs ------------------------------------------------------------
export interface BatchParseCvsRequest {
  /** Array of storage paths (CVs uploaded to `talent-cvs`) to enrich. */
  paths: string[];
  /** Whether to upsert into the talents table (vs. dry-run preview). */
  commit?: boolean;
  /** Optional override of the AI model id. */
  model?: string;
}

export type BatchParseCvsResponse = Record<string, unknown>;

// ai-support-assistant -------------------------------------------------------
export interface AiSupportAssistantRequest {
  /** Last few chat turns to pass as context. */
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  /** Optional support ticket identifier for grounding. */
  ticketId?: string;
}

export type AiSupportAssistantResponse = Record<string, unknown>;

// generate-outreach-message --------------------------------------------------
export interface GenerateOutreachMessageRequest {
  talentId: string;
  channel: "email" | "whatsapp" | "linkedin";
  /** Optional purpose/role context to tailor copy. */
  context?: string;
}

export type GenerateOutreachMessageResponse = Record<string, unknown>;
