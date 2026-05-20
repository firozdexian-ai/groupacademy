/**
 * Companies domain — typed edge function wrappers (Phase 9h).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  CheckCompanyAccountResponseSchema,
  SignupCompanyResponseSchema,
  type CheckCompanyAccountRequest,
  type CheckCompanyAccountResponse,
  type SignupCompanyRequest,
  type SignupCompanyResponse,
} from "@/edge/contracts/companies";

export async function signupCompany(
  req: SignupCompanyRequest,
): Promise<SignupCompanyResponse> {
  const { data, error } = await supabase.functions.invoke("signup-company", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("signup-company", error);
  return parseEdgeResponse(
    "signup-company",
    SignupCompanyResponseSchema,
    data ?? {},
  );
}

export async function checkCompanyAccount(
  req: CheckCompanyAccountRequest,
): Promise<CheckCompanyAccountResponse> {
  const { data, error } = await supabase.functions.invoke(
    "check-company-account",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("check-company-account", error);
  return parseEdgeResponse(
    "check-company-account",
    CheckCompanyAccountResponseSchema,
    data ?? {},
  );
}
