/**
 * Marketing domain — typed edge function wrappers (Phase 9g).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  LeadHuntMatchResponseSchema,
  type LeadHuntMatchRequest,
  type LeadHuntMatchResponse,
} from "@/edge/contracts/marketing";

export async function leadHuntMatch(
  req: LeadHuntMatchRequest,
): Promise<LeadHuntMatchResponse> {
  const { data, error } = await supabase.functions.invoke("lead-hunt-match", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("lead-hunt-match", error);
  return parseEdgeResponse(
    "lead-hunt-match",
    LeadHuntMatchResponseSchema,
    data ?? {},
  );
}
