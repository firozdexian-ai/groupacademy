/**
 * Profile domain — typed edge function wrappers (Phase 9g).
 *
 * Only `claim-public-handle` is owned by profile. `parse-cv` is owned by
 * jobs — import from `@/domains/jobs/api/jobsApi` directly.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  ClaimPublicHandleResponseSchema,
  type ClaimPublicHandleRequest,
  type ClaimPublicHandleResponse,
} from "@/edge/contracts/profile";

export async function claimPublicHandle(
  req: ClaimPublicHandleRequest,
): Promise<ClaimPublicHandleResponse> {
  const { data, error } = await supabase.functions.invoke(
    "claim-public-handle",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("claim-public-handle", error);
  return parseEdgeResponse(
    "claim-public-handle",
    ClaimPublicHandleResponseSchema,
    data ?? {},
  );
}
