/**
 * Typed wrappers around talent-domain edge functions (Phase 9a pilot).
 *
 * Wrappers are intentionally thin — same wire bytes as a raw
 * `supabase.functions.invoke`, just with request/response types and a
 * uniform `EdgeFunctionError` on failure.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import type {
  AiSupportAssistantRequest,
  AiSupportAssistantResponse,
  BatchParseCvsRequest,
  BatchParseCvsResponse,
  GenerateOutreachMessageRequest,
  GenerateOutreachMessageResponse,
} from "@/edge/contracts/talent";

export async function batchParseCvs(
  req: BatchParseCvsRequest,
): Promise<BatchParseCvsResponse> {
  const { data, error } = await supabase.functions.invoke("batch-parse-cvs", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("batch-parse-cvs", error);
  return (data ?? {}) as BatchParseCvsResponse;
}

export async function aiSupportAssistant(
  req: AiSupportAssistantRequest,
): Promise<AiSupportAssistantResponse> {
  const { data, error } = await supabase.functions.invoke("ai-support-assistant", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-support-assistant", error);
  return (data ?? { reply: "" }) as AiSupportAssistantResponse;
}

export async function generateOutreachMessage(
  req: GenerateOutreachMessageRequest,
): Promise<GenerateOutreachMessageResponse> {
  const { data, error } = await supabase.functions.invoke(
    "generate-outreach-message",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("generate-outreach-message", error);
  return (data ?? {}) as GenerateOutreachMessageResponse;
}

export const talentApi = {
  batchParseCvs,
  aiSupportAssistant,
  generateOutreachMessage,
} as const;

export type TalentApi = typeof talentApi;
