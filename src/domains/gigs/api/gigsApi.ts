/**
 * Gigs domain — typed edge function wrappers (Phase 9g).
 *
 * Convention (see `src/edge/README.md`):
 *   - one async function per edge function, imported by name
 *   - throws `EdgeFunctionError` on transport failure
 *   - response validated via `parseEdgeResponse`
 *
 * Only `ai-bid-coach` is owned by gigs. Cross-domain callers should
 * import `parseJobPost`, `generateJobShareCaption` from the jobs domain
 * wrapper and `generateOutreachMessage` from the talent domain wrapper.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AiBidCoachResponseSchema,
  type AiBidCoachRequest,
  type AiBidCoachResponse,
} from "@/edge/contracts/gigs";

export async function aiBidCoach(
  req: AiBidCoachRequest,
): Promise<AiBidCoachResponse> {
  const { data, error } = await supabase.functions.invoke("ai-bid-coach", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-bid-coach", error);
  return parseEdgeResponse("ai-bid-coach", AiBidCoachResponseSchema, data ?? {});
}
