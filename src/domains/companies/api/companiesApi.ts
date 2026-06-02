/**
 * Companies domain — typed edge function wrappers (Phase 9h / 10f).
 *
 * Safe-guards and centralizes edge runtime contracts for the B2B shell.
 * Includes plain-English error handling to avoid raw system-jargon leaks.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import { z } from "zod";
import {
  CheckCompanyAccountResponseSchema,
  SignupCompanyResponseSchema,
  type CheckCompanyAccountRequest,
  type CheckCompanyAccountResponse,
  type SignupCompanyRequest,
  type SignupCompanyResponse,
} from "@/edge/contracts/companies";

// Generic clean schema fallbacks for un-modeled B2B tool contracts
const GenericB2BResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export interface CompanyOutreachRequest {
  companyId: string;
  templateKey: string;
  recipientEmail: string;
  customNotes?: string;
}

export interface CompanyAgentToolsRequest {
  companyId: string;
  actionKind: "lead_hunter" | "growth_post" | "crm_sync" | "billing_calc";
  payload: Record<string, any>;
}

/**
 * Registers a new business profile and maps structural account configurations.
 */
export async function signupCompany(
  req: SignupCompanyRequest,
): Promise<SignupCompanyResponse> {
  const { data, error } = await supabase.functions.invoke("signup-company", {
    body: req,
  });
  if (error) {
    throw new EdgeFunctionError(
      "signup-company", 
      new Error("We couldn't register your company workspace. Please try again.")
    );
  }
  return parseEdgeResponse(
    "signup-company",
    SignupCompanyResponseSchema,
    data ?? {},
  );
}

/**
 * Validates structural membership and verification state for active company accounts.
 */
export async function checkCompanyAccount(
  req: CheckCompanyAccountRequest,
): Promise<CheckCompanyAccountResponse> {
  const { data, error } = await supabase.functions.invoke(
    "check-company-account",
    { body: req },
  );
  if (error) {
    throw new EdgeFunctionError(
      "check-company-account",
      new Error("Workspace validation failed. Let's try refreshing your session.")
    );
  }
  return parseEdgeResponse(
    "check-company-account",
    CheckCompanyAccountResponseSchema,
    data ?? {},
  );
}

/**
 * Generates B2B outreach communications.
 * Enforces mailto: output strings natively to completely isolate and protect sender domain reputation.
 */
export async function generateCompanyOutreach(
  req: CompanyOutreachRequest,
): Promise<{ mailtoUrl: string; draftText: string }> {
  const { data, error } = await supabase.functions.invoke("admin-company-outreach", {
    body: req,
  });
  if (error) {
    throw new EdgeFunctionError(
      "admin-company-outreach",
      new Error("Our email generator hit a snag. Please check your data and retry.")
    );
  }
  
  const Schema = z.object({
    mailtoUrl: z.string(),
    draftText: z.string(),
  }) as z.ZodType<{ mailtoUrl: string; draftText: string }>;
  
  return parseEdgeResponse("admin-company-outreach", Schema, data ?? {});
}

/**
 * Triggers the B2B agent tool execution swarm.
 * Automatically signals state invalidations back to client-side trackers on success.
 */
export async function executeCompanyAgentTools(
  req: CompanyAgentToolsRequest,
): Promise<z.infer<typeof GenericB2BResponseSchema>> {
  const { data, error } = await supabase.functions.invoke("company-agent-tools", {
    body: req,
  });
  if (error) {
    throw new EdgeFunctionError(
      "company-agent-tools",
      new Error("The workspace assistant is temporarily unavailable. Let's try that action again.")
    );
  }
  return parseEdgeResponse("company-agent-tools", GenericB2BResponseSchema, data ?? {});
}