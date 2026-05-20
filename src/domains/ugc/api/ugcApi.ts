/**
 * UGC domain — typed edge function wrappers (Phase 9h).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AdminContentAiResponseSchema,
  type AdminContentAiRequest,
  type AdminContentAiResponse,
} from "@/edge/contracts/ugc";

export async function adminContentAi(
  req: AdminContentAiRequest,
): Promise<AdminContentAiResponse> {
  const { data, error } = await supabase.functions.invoke("admin-content-ai", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("admin-content-ai", error);
  return parseEdgeResponse(
    "admin-content-ai",
    AdminContentAiResponseSchema,
    data ?? {},
  );
}
