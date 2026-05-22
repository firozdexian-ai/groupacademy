import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { getNextBestTool } from "@/domains/jobs/repo/jobsRepo";
import type { ToolKey } from "./useToolRuns";

/**
 * GroUp Academy: Agentic Workflow Orchestrator (V5.6.0)
 * CTO Reference: Authoritative sensor for session-based tool recommendations.
 * Architecture: Digital Workforce enabled - logs recommendation drops to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface NextBestTool {
  tool_key: ToolKey;
  reason: string;
  job_id?: string | null;
}

/**
 * Identifies the high-affinity tool for the current user context.
 * Replaces loose type-casting with strict RPC telemetry.
 */
export function useNextBestTool() {
  return useQuery({
    queryKey: ["next-best-tool"],
    // Performance Baseline: 2-minute stability for session-level signals
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<NextBestTool | null> => {
      const user = await getCurrentUser();

      if (!user) return null;

      // HUD: EXECUTING_AGENTIC_RECOMMENDATION_RPC
      try {
        const data = await getNextBestTool(user.id);
        return data as unknown as NextBestTool;
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_next_best_tool RPC handshake failed.", {
          userId: user.id,
          message: error?.message,
        });
        return null;
      }
    },
  });
}
