/**
 * Typed wrappers around talent-domain edge functions (Phase 9a/9b + 9h).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AnalyzeCareerAssessmentResponseSchema,
  AnalyzeSalaryResponseSchema,
  BatchParseCvsResponseSchema,
  GenerateOutreachMessageResponseSchema,
  UnlockTalentContactResponseSchema,
  type AnalyzeCareerAssessmentRequest,
  type AnalyzeCareerAssessmentResponse,
  type AnalyzeSalaryRequest,
  type AnalyzeSalaryResponse,
  type BatchParseCvsRequest,
  type BatchParseCvsResponse,
  type GenerateOutreachMessageRequest,
  type GenerateOutreachMessageResponse,
  type UnlockTalentContactRequest,
  type UnlockTalentContactResponse,
} from "@/edge/contracts/talent";

export async function batchParseCvs(
  req: BatchParseCvsRequest,
): Promise<BatchParseCvsResponse> {
  const { data, error } = await supabase.functions.invoke("batch-parse-cvs", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("batch-parse-cvs", error);
  return parseEdgeResponse("batch-parse-cvs", BatchParseCvsResponseSchema, data ?? {});
}

export async function generateOutreachMessage(
  req: GenerateOutreachMessageRequest,
): Promise<GenerateOutreachMessageResponse> {
  const { data, error } = await supabase.functions.invoke(
    "generate-outreach-message",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("generate-outreach-message", error);
  return parseEdgeResponse(
    "generate-outreach-message",
    GenerateOutreachMessageResponseSchema,
    data ?? {},
  );
}

// Phase 9h additions --------------------------------------------------------
export async function unlockTalentContact(
  req: UnlockTalentContactRequest,
): Promise<UnlockTalentContactResponse> {
  const { data, error } = await supabase.functions.invoke(
    "unlock-talent-contact",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("unlock-talent-contact", error);
  return parseEdgeResponse(
    "unlock-talent-contact",
    UnlockTalentContactResponseSchema,
    data ?? {},
  );
}

export async function analyzeSalary(
  req: AnalyzeSalaryRequest,
): Promise<AnalyzeSalaryResponse> {
  const { data, error } = await supabase.functions.invoke("analyze-salary", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("analyze-salary", error);
  return parseEdgeResponse(
    "analyze-salary",
    AnalyzeSalaryResponseSchema,
    data ?? {},
  );
}

export async function analyzeCareerAssessment(
  req: AnalyzeCareerAssessmentRequest,
): Promise<AnalyzeCareerAssessmentResponse> {
  const { data, error } = await supabase.functions.invoke(
    "analyze-career-assessment",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("analyze-career-assessment", error);
  return parseEdgeResponse(
    "analyze-career-assessment",
    AnalyzeCareerAssessmentResponseSchema,
    data ?? {},
  );
}
