/**
 * UGC domain — edge function contracts (Phase 9h).
 */
import { z } from "zod";

// admin-content-ai ----------------------------------------------------------
export interface AdminContentAiRequest {
  mode: string;
  context: Record<string, unknown>;
  [k: string]: unknown;
}

export const AdminContentAiResponseSchema = z
  .object({
    result: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AdminContentAiResponse = z.infer<
  typeof AdminContentAiResponseSchema
>;
