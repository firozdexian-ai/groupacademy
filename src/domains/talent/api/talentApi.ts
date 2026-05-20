/**
 * Typed wrappers around talent-domain edge functions.
 *
 * Convention (locked in Phase 9b):
 *   - One async function per edge function — import by name.
 *   - No `*Api` const, no `<DOMAIN>_EDGE_FUNCTIONS` array.
 *   - Responses validated at runtime via `parseEdgeResponse`.
 *   - Failures throw `EdgeFunctionError`.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  BatchParseCvsResponseSchema,
  GenerateOutreachMessageResponseSchema,
  type BatchParseCvsRequest,
  type BatchParseCvsResponse,
  type GenerateOutreachMessageRequest,
  type GenerateOutreachMessageResponse,
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
