import { supabase } from "@/integrations/supabase/client";
import type {
  UpdateStripeSecretRequest,
  UpdateStripeSecretResponse,
  ProcessWithdrawalRequest,
  ProcessWithdrawalResponse,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
} from "@/edge/contracts/finance";

export const financeApi = {
  updateStripeSecret: (body: UpdateStripeSecretRequest) =>
    supabase.functions.invoke<UpdateStripeSecretResponse>("update-stripe-secret", { body }),
  processWithdrawal: (body: ProcessWithdrawalRequest) =>
    supabase.functions.invoke<ProcessWithdrawalResponse>("process-withdrawal", { body }),
  createCheckout: (body: CreateCheckoutRequest) =>
    supabase.functions.invoke<CreateCheckoutResponse>("create-checkout", { body }),
} as const;
