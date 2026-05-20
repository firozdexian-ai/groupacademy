/**
 * Gigs domain — edge function contracts (Phase 9g + 9h).
 */
import { z } from "zod";

// ai-bid-coach ---------------------------------------------------------------
export interface AiBidCoachRequest {
  gig_id: string;
  gig_kind?: string;
  draft_text: string;
  [k: string]: unknown;
}

export const AiBidCoachResponseSchema = z
  .object({
    suggestions: z.array(z.string()).optional(),
    improved: z.string().optional(),
    rationale: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiBidCoachResponse = z.infer<typeof AiBidCoachResponseSchema>;

// admin-gig-ops (Phase 9h) ---------------------------------------------------
/**
 * Fire-and-forget telemetry sink for gig ops anomalies. Mirrors
 * `admin-support-assistant` shape; documented in
 * `.lovable/known-edge-contract-drift.md`.
 */
export interface AdminGigOpsRequest {
  type?: string;
  event?: string;
  context?: unknown;
  [k: string]: unknown;
}

export const AdminGigOpsResponseSchema = z
  .object({ ok: z.boolean().optional(), error: z.string().optional() })
  .passthrough();
export type AdminGigOpsResponse = z.infer<typeof AdminGigOpsResponseSchema>;

// ai-reviewer-brief (Phase 9h) ----------------------------------------------
export interface AiReviewerBriefRequest {
  assignment_id: string;
  [k: string]: unknown;
}

export const AiReviewerBriefResponseSchema = z
  .object({ brief: z.string().optional(), error: z.string().optional() })
  .passthrough();
export type AiReviewerBriefResponse = z.infer<
  typeof AiReviewerBriefResponseSchema
>;

// ai-project-scoper (Phase 9h) ----------------------------------------------
export interface AiProjectScoperRequest {
  brief: string;
  budget_credits?: number;
  [k: string]: unknown;
}

export const AiProjectScoperResponseSchema = z
  .object({
    milestones: z.array(z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiProjectScoperResponse = z.infer<
  typeof AiProjectScoperResponseSchema
>;

// ai-gig-verifier (Phase 9h) ------------------------------------------------
export interface AiGigVerifierRequest {
  submission_id: string;
  gig_kind?: string;
  [k: string]: unknown;
}

export const AiGigVerifierResponseSchema = z
  .object({ ok: z.boolean().optional(), error: z.string().optional() })
  .passthrough();
export type AiGigVerifierResponse = z.infer<typeof AiGigVerifierResponseSchema>;

// ai-gig-scoper (Phase 9h) --------------------------------------------------
export interface AiGigScoperRequest {
  brief_id?: string;
  raw_ask?: string;
  [k: string]: unknown;
}

export const AiGigScoperResponseSchema = z
  .object({
    brief: z.unknown().optional(),
    draft: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiGigScoperResponse = z.infer<typeof AiGigScoperResponseSchema>;

// ai-gig-public-summary (Phase 9h) ------------------------------------------
export interface AiGigPublicSummaryRequest {
  project_id: string;
  [k: string]: unknown;
}

export const AiGigPublicSummaryResponseSchema = z
  .object({ ok: z.boolean().optional(), error: z.string().optional() })
  .passthrough();
export type AiGigPublicSummaryResponse = z.infer<
  typeof AiGigPublicSummaryResponseSchema
>;

// og-image-render (Phase 9h) ------------------------------------------------
export interface OgImageRenderRequest {
  project_id?: string;
  [k: string]: unknown;
}

export const OgImageRenderResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    url: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type OgImageRenderResponse = z.infer<typeof OgImageRenderResponseSchema>;
