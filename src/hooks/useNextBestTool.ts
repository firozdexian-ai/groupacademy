import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ToolKey } from "./useToolRuns";

export interface NextBestTool {
  tool_key: ToolKey;
  reason: string;
  job_id?: string | null;
}

export function useNextBestTool() {
  return useQuery({
    queryKey: ["next-best-tool"],
    queryFn: async (): Promise<NextBestTool | null> => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data, error } = await supabase.rpc("get_next_best_tool" as any, {
        p_user_id: userRes.user.id,
      });
      if (error) {
        console.warn("get_next_best_tool failed", error);
        return null;
      }
      return data as NextBestTool;
    },
    staleTime: 2 * 60_000,
  });
}
