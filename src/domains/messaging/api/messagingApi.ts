/**
 * Messaging domain — typed edge function wrappers (Phase 9g).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  UnipileConnectResponseSchema,
  type UnipileConnectRequest,
  type UnipileConnectResponse,
} from "@/edge/contracts/messaging";

export async function unipileConnect(
  req: UnipileConnectRequest,
): Promise<UnipileConnectResponse> {
  const { data, error } = await supabase.functions.invoke("unipile-connect", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("unipile-connect", error);
  return parseEdgeResponse(
    "unipile-connect",
    UnipileConnectResponseSchema,
    data ?? {},
  );
}
