/**
 * Edge-function contracts for the talent domain (Phase 9a).
 *
 * Shapes derive from the live call sites under
 * `src/domains/talent/components/admin/*` and the edge function
 * sources at `supabase/functions/<name>/index.ts`.
 */

// batch-parse-cvs ------------------------------------------------------------
export interface BatchParseCvsRequest {
  /** Signed URLs of CV PDFs to enrich. */
  cvUrls: string[];
  /** `batch_uploads.id` to bind progress to. */
  batchId: string;
}

export interface BatchParseCvsResponse {
  success: boolean;
  message?: string;
  batchId?: string;
  error?: string;
}

// ai-support-assistant -------------------------------------------------------
export interface AiSupportAssistantRequest {
  /** Data URL of the chat screenshot to analyze. */
  image: string;
  /** Optional natural-language context for grounding. */
  context?: string;
}

export interface AiSupportAssistantResponse {
  reply: string;
  tone?: string;
  suggestions?: string[];
  actions?: string[];
  error?: string;
}

// generate-outreach-message --------------------------------------------------
export interface GenerateOutreachMessageRequest {
  /** Talent id (call site uses snake_case). */
  talent_id: string;
  /** Product context label passed through to the AI prompt. */
  product_context?: string;
}

export interface GenerateOutreachMessageResponse {
  success?: boolean;
  message?: string;
  name?: string;
  phone?: string;
  phoneNumbers?: string[];
  gender?: string;
  whatsappLink?: string;
  professionCategory?: string;
  productLink?: string;
  error?: string;
}
