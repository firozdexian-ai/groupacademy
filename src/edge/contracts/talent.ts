/**
 * Edge-function contracts for the talent domain (Phase 9a/9b).
 *
 * Shapes derive from live call sites and the edge function sources
 * at `supabase/functions/<name>/index.ts`. Responses are zod schemas
 * so contract drift fails loud via `parseEdgeResponse`.
 */
import { z } from "zod";

// batch-parse-cvs ------------------------------------------------------------
export interface BatchParseCvsRequest {
  /** Signed URLs of CV PDFs to enrich. */
  cvUrls: string[];
  /** `batch_uploads.id` to bind progress to. */
  batchId: string;
}

export const BatchParseCvsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  batchId: z.string().optional(),
  error: z.string().optional(),
});
export type BatchParseCvsResponse = z.infer<typeof BatchParseCvsResponseSchema>;

// ai-support-assistant -------------------------------------------------------
export interface AiSupportAssistantRequest {
  /** Data URL of the chat screenshot to analyze. */
  image: string;
  /** Optional natural-language context for grounding. */
  context?: string;
}

export const AiSupportAssistantResponseSchema = z.object({
  reply: z.string(),
  tone: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  actions: z.array(z.string()).optional(),
  error: z.string().optional(),
});
export type AiSupportAssistantResponse = z.infer<
  typeof AiSupportAssistantResponseSchema
>;

// generate-outreach-message --------------------------------------------------
export interface GenerateOutreachMessageRequest {
  /** Talent id (call site uses snake_case). */
  talent_id: string;
  /** Product context label passed through to the AI prompt. */
  product_context?: string;
}

export const GenerateOutreachMessageResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  phoneNumbers: z.array(z.string()).optional(),
  gender: z.string().optional(),
  whatsappLink: z.string().optional(),
  professionCategory: z.string().optional(),
  productLink: z.string().optional(),
  error: z.string().optional(),
});
export type GenerateOutreachMessageResponse = z.infer<
  typeof GenerateOutreachMessageResponseSchema
>;
