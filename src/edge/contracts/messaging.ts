/**
 * Messaging domain — edge function contracts (Phase 9g + 9h).
 */
import { z } from "zod";

export type UnipileAction =
  | "start_hosted_auth"
  | "verify_and_save"
  | "delete"
  | "reconcile";

export interface UnipileConnectRequest {
  action: UnipileAction;
  agent_key: string;
  label?: string;
  region?: string;
  provider?: "whatsapp" | "telegram";
  account_id?: string;
  [key: string]: unknown;
}

export const UnipileConnectResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    url: z.string().optional(),
    channel_id: z.string().optional(),
    phone: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type UnipileConnectResponse = z.infer<
  typeof UnipileConnectResponseSchema
>;

// messaging-send (Phase 9h) -------------------------------------------------
export interface MessagingSendRequest {
  conversation_id: string;
  text: string;
  [k: string]: unknown;
}

export const MessagingSendResponseSchema = z
  .object({ ok: z.boolean().optional(), error: z.string().optional() })
  .passthrough();
export type MessagingSendResponse = z.infer<typeof MessagingSendResponseSchema>;

// messaging-group-manager (Phase 9h) ----------------------------------------
export interface MessagingGroupManagerRequest {
  action: string;
  company_id?: string;
  group_kind?: string;
  agent_key?: string;
  name?: string;
  [k: string]: unknown;
}

export const MessagingGroupManagerResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    group_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type MessagingGroupManagerResponse = z.infer<
  typeof MessagingGroupManagerResponseSchema
>;

// send-transactional-email (Phase 9h) ---------------------------------------
export interface SendTransactionalEmailRequest {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
  [k: string]: unknown;
}

export const SendTransactionalEmailResponseSchema = z
  .object({
    success: z.boolean().optional(),
    queued: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type SendTransactionalEmailResponse = z.infer<
  typeof SendTransactionalEmailResponseSchema
>;

// telegram-diagnostic (Phase 9h) --------------------------------------------
export interface TelegramDiagnosticRequest {
  [k: string]: unknown;
}

export const TelegramDiagnosticResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    count: z.number().optional(),
    total_updates: z.number().optional(),
    chats: z.array(z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type TelegramDiagnosticResponse = z.infer<
  typeof TelegramDiagnosticResponseSchema
>;

// handle-email-unsubscribe (Phase 9h) ---------------------------------------
export interface HandleEmailUnsubscribeRequest {
  token: string;
  action: "validate" | "confirm";
}

export const HandleEmailUnsubscribeResponseSchema = z
  .object({
    valid: z.boolean().optional(),
    success: z.boolean().optional(),
    reason: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type HandleEmailUnsubscribeResponse = z.infer<
  typeof HandleEmailUnsubscribeResponseSchema
>;
