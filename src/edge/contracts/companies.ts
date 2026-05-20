/**
 * Companies domain — edge function contracts (Phase 9h).
 */
import { z } from "zod";

// signup-company ------------------------------------------------------------
export interface SignupCompanyRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  company_name: string;
  country?: string | null;
  industry?: string | null;
  company_size?: string | null;
  website?: string | null;
  [k: string]: unknown;
}

export const SignupCompanyResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    company_id: z.string().optional(),
    user_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type SignupCompanyResponse = z.infer<typeof SignupCompanyResponseSchema>;

// check-company-account -----------------------------------------------------
export interface CheckCompanyAccountRequest {
  email: string;
}

export const CheckCompanyAccountResponseSchema = z
  .object({
    exists: z.boolean().optional(),
    isCompany: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type CheckCompanyAccountResponse = z.infer<
  typeof CheckCompanyAccountResponseSchema
>;
