import { supabase } from "@/integrations/supabase/client";
import type { UnipileConnectRequest, UnipileConnectResponse } from "@/edge/contracts/messaging";

export const messagingApi = {
  async unipileConnect(body: UnipileConnectRequest): Promise<UnipileConnectResponse> {
    const { data, error } = await supabase.functions.invoke("unipile-connect", { body });
    if (error) throw error;
    return (data ?? {}) as UnipileConnectResponse;
  },
};
