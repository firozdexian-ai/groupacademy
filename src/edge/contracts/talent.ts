/**
 * Edge-function contracts for the talent domain (Phase 9a/9b + 9h).
 */
import { z } from "zod";

// batch-parse-cvs ------------------------------------------------------------
export interface BatchParseCvsRequest {
  cvUrls: string[];
  batchId: string;
}

export const BatchParseCvsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  batchId: z.string().optional(),
  error: z.string().optional(),
});
export type BatchParseCvsResponse = z.infer<typeof BatchParseCvsResponseSchema>;

// generate-outreach-message --------------------------------------------------
export interface GenerateOutreachMessageRequest {
  talent_id: string;
  product_context?: string;
}

export const GenerateOutreachMessageResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  phoneNumbers: z.array(z.string()).optional(),
  gender: z.string().optional(),
  whatsappLink: z.string().optional(),
  professionCategory: z.string().optional(),
  productLink: z.string().optional(),
  error: z.string().optional(),
});
export type GenerateOutreachMessageResponse = z.infer<
  typeof GenerateOutreachMessageResponseSchema
>;

// unlock-talent-contact (Phase 9h) ------------------------------------------
export interface UnlockTalentContactRequest {
  company_id: string;
  talent_id: string;
  [k: string]: unknown;
}

export const UnlockTalentContactResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    contact: z.unknown().optional(),
    credits_spent: z.number().optional(),
    reused: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type UnlockTalentContactResponse = z.infer<
  typeof UnlockTalentContactResponseSchema
>;

// analyze-salary (Phase 9h) -------------------------------------------------
export interface AnalyzeSalaryRequest {
  analysisId: string;
  [k: string]: unknown;
}

export const AnalyzeSalaryResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    analysis: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AnalyzeSalaryResponse = z.infer<typeof AnalyzeSalaryResponseSchema>;

// analyze-career-assessment (Phase 9h) --------------------------------------
export interface AnalyzeCareerAssessmentRequest {
  assessmentId?: string;
  answers?: unknown;
  professionCategoryId?: string;
  email?: string;
  talentId?: string;
  [k: string]: unknown;
}

export const AnalyzeCareerAssessmentResponseSchema = z
  .object({
    analysis: z.unknown().optional(),
    assessmentId: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AnalyzeCareerAssessmentResponse = z.infer<
  typeof AnalyzeCareerAssessmentResponseSchema
>;
