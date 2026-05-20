/**
 * Finance domain — edge function contracts (Phase 9g + 9h).
 */
import { z } from "zod";

export type UpdateStripeSecretRequest =
  | { action: "check" }
  | { action: "save-key"; stripeSecretKey: string }
  | { action: "save-webhook"; stripeWebhookSecret: string };

export const UpdateStripeSecretResponseSchema = z
  .object({
    hasSecretKey: z.boolean().optional(),
    hasWebhookSecret: z.boolean().optional(),
    saved: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type UpdateStripeSecretResponse = z.infer<
  typeof UpdateStripeSecretResponseSchema
>;

export interface ProcessWithdrawalRequest {
  withdrawal_id: string;
  action: string;
  admin_notes: string | null;
  [k: string]: unknown;
}

export const ProcessWithdrawalResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    success: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type ProcessWithdrawalResponse = z.infer<
  typeof ProcessWithdrawalResponseSchema
>;

export interface CreateCheckoutRequest {
  [k: string]: unknown;
}

export const CreateCheckoutResponseSchema = z
  .object({
    url: z.string().optional(),
    session_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type CreateCheckoutResponse = z.infer<
  typeof CreateCheckoutResponseSchema
>;

// request-instructor-payout (Phase 9h) --------------------------------------
export interface RequestInstructorPayoutRequest {
  amount: number;
  method: string;
  details: Record<string, unknown>;
  [k: string]: unknown;
}

export const RequestInstructorPayoutResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    payout_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type RequestInstructorPayoutResponse = z.infer<
  typeof RequestInstructorPayoutResponseSchema
>;
