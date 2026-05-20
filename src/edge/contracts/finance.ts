export type UpdateStripeSecretRequest =
  | { action: "check" }
  | { action: "save-key"; stripeSecretKey: string }
  | { action: "save-webhook"; stripeWebhookSecret: string };

export interface UpdateStripeSecretResponse {
  hasSecretKey?: boolean;
  hasWebhookSecret?: boolean;
  saved?: boolean;
  error?: string;
}

export interface ProcessWithdrawalRequest {
  withdrawal_id: string;
  action: string;
  admin_notes: string | null;
}

export type ProcessWithdrawalResponse = Record<string, unknown>;

export type CreateCheckoutRequest = Record<string, unknown>;
export type CreateCheckoutResponse = Record<string, unknown>;
