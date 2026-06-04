/**
 * GroUp Academy: Finance Domain Serverless Edge Function Wrappers
 * Safe, explicitly typed integration pathways coordinating platform checkout flows and payout operations.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  CreateCheckoutResponseSchema,
  ProcessWithdrawalResponseSchema,
  RequestInstructorPayoutResponseSchema,
  UpdateStripeSecretResponseSchema,
  type CreateCheckoutRequest,
  type CreateCheckoutResponse,
  type ProcessWithdrawalRequest,
  type ProcessWithdrawalResponse,
  type RequestInstructorPayoutRequest,
  type RequestInstructorPayoutResponse,
  type UpdateStripeSecretRequest,
  type UpdateStripeSecretResponse,
} from "@/edge/contracts/finance";

/**
 * Validates, checks, or updates Stripe private access tokens and webhook secret properties.
 */
export async function updateStripeSecret(req: UpdateStripeSecretRequest): Promise<UpdateStripeSecretResponse> {
  const { data, error } = await supabase.functions.invoke("update-stripe-secret", { body: req });
  if (error) throw new EdgeFunctionError("update-stripe-secret", error);
  return parseEdgeResponse("update-stripe-secret", UpdateStripeSecretResponseSchema, data ?? {});
}

/**
 * Executes or modifies an active user cash withdrawal/balance disbursement operation request.
 */
export async function processWithdrawal(req: ProcessWithdrawalRequest): Promise<ProcessWithdrawalResponse> {
  const { data, error } = await supabase.functions.invoke("process-withdrawal", { body: req });
  if (error) throw new EdgeFunctionError("process-withdrawal", error);
  return parseEdgeResponse("process-withdrawal", ProcessWithdrawalResponseSchema, data ?? {});
}

/**
 * Requests an authenticated, automated checkout session token for candidate credit top-ups.
 */
export async function createCheckout(req: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("create-checkout", error);
  return parseEdgeResponse("create-checkout", CreateCheckoutResponseSchema, data ?? {});
}

/**
 * Submits an automated creator split earnings withdrawal request back to administration for validation.
 */
export async function requestInstructorPayout(
  req: RequestInstructorPayoutRequest,
): Promise<RequestInstructorPayoutResponse> {
  const { data, error } = await supabase.functions.invoke("request-instructor-payout", { body: req });
  if (error) throw new EdgeFunctionError("request-instructor-payout", error);
  return parseEdgeResponse("request-instructor-payout", RequestInstructorPayoutResponseSchema, data ?? {});
}
