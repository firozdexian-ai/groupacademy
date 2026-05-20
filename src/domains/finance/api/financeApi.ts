/**
 * Finance domain — typed edge function wrappers (Phase 9g).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  CreateCheckoutResponseSchema,
  ProcessWithdrawalResponseSchema,
  UpdateStripeSecretResponseSchema,
  type CreateCheckoutRequest,
  type CreateCheckoutResponse,
  type ProcessWithdrawalRequest,
  type ProcessWithdrawalResponse,
  type UpdateStripeSecretRequest,
  type UpdateStripeSecretResponse,
} from "@/edge/contracts/finance";

export async function updateStripeSecret(
  req: UpdateStripeSecretRequest,
): Promise<UpdateStripeSecretResponse> {
  const { data, error } = await supabase.functions.invoke(
    "update-stripe-secret",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("update-stripe-secret", error);
  return parseEdgeResponse(
    "update-stripe-secret",
    UpdateStripeSecretResponseSchema,
    data ?? {},
  );
}

export async function processWithdrawal(
  req: ProcessWithdrawalRequest,
): Promise<ProcessWithdrawalResponse> {
  const { data, error } = await supabase.functions.invoke(
    "process-withdrawal",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("process-withdrawal", error);
  return parseEdgeResponse(
    "process-withdrawal",
    ProcessWithdrawalResponseSchema,
    data ?? {},
  );
}

export async function createCheckout(
  req: CreateCheckoutRequest,
): Promise<CreateCheckoutResponse> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("create-checkout", error);
  return parseEdgeResponse(
    "create-checkout",
    CreateCheckoutResponseSchema,
    data ?? {},
  );
}
