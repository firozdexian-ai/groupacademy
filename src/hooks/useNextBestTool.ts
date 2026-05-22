import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { getNextBestTool } from "@/domains/jobs/repo/jobsRepo";
import type { ToolKey } from "./useToolRuns";

/**
 * Recommends the single best next AI tool for the current user, based on
 * their profile state and recent activity (via the get_next_best_tool RPC).
 */

export interface NextBestTool {
  tool_key: ToolKey;
  reason: string;
  job_id?: string | null;
}

export function useNextBestTool() {
  return useQuery({
    queryKey: ["next-best-tool"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<NextBestTool | null> => {
      const user = await getCurrentUser();
      if (!user) return null;

      try {
        const data = await getNextBestTool(user.id);
        return data as unknown as NextBestTool;
      } catch (error: any) {
        console.error("Failed to load next-best tool recommendation", {
          userId: user.id,
          message: error?.message,
        });
        return null;
      }
    },
  });
}
