/**
 * Edge function contracts for the messaging domain.
 */

export type UnipileAction = "start_hosted_auth" | "verify_and_save" | "delete" | "reconcile";

export interface UnipileConnectRequest {
  action: UnipileAction;
  agent_key: string;
  label?: string;
  region?: string;
  provider?: "whatsapp" | "telegram";
  account_id?: string;
  [key: string]: unknown;
}

export interface UnipileConnectResponse {
  ok?: boolean;
  url?: string;
  channel_id?: string;
  phone?: string;
  error?: string;
  [key: string]: unknown;
}
