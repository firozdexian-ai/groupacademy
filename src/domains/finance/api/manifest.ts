/**
 * GroUp Academy: Finance Domain Core API Module Entry (Barrel Router)
 * Centralizes named execution hooks and typed definitions for credit checkouts, webhook secrets, and payout disbursement routes.
 */

export { updateStripeSecret, processWithdrawal, createCheckout, requestInstructorPayout } from "./financeApi";

export type {
  UpdateStripeSecretRequest,
  UpdateStripeSecretResponse,
  ProcessWithdrawalRequest,
  ProcessWithdrawalResponse,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  RequestInstructorPayoutRequest,
  RequestInstructorPayoutResponse,
} from "@/edge/contracts/finance";
