import { useQuery } from "@tanstack/react-query";
import { getCachedJobMatchScore } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: AI Match Cache Sensor (V5.6.0)
 * CTO Reference: Read-only observer for pre-calculated talent-job alignment metrics.
 * Architecture: Digital Workforce enabled - logs registry sync faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export interface JobMatchCache {
  score: number;
  rationale: string | null;
  scoredAt: string | null;
}

/**
 * Retrieves a previously cached AI match score for a user-job pair.
 * Zero-credit operation; returns null if no score registry exists.
 */
export function useJobMatchCached(jobId: string | undefined, talentId: string | undefined) {
  return useQuery({
    queryKey: ["job-match-cached", jobId, talentId],
    enabled: !!jobId && !!talentId,
    // Performance Baseline: 5-minute stability caching to protect database resources
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<JobMatchCache | null> => {
      // HUD: EXECUTING_CACHED_MATCH_REGISTRY_SYNC
      const { data, error } = await supabase
        .from("job_applications")
        .select("ai_match_score, ai_match_rationale, ai_scored_at")
        .eq("job_id", jobId!)
        .eq("talent_id", talentId!)
        .maybeSingle();

      if (error) {
        // Digital Workforce Anomaly Trigger:
        // Critical for monitoring RLS isolation failures or registry latency.
        console.error("[Digital Workforce] FAULT: job_match_cached lookup failed.", {
          jobId,
          talentId,
          error: error.message,
        });
        throw error;
      }

      if (!data || data.ai_match_score === null) return null;

      return {
        score: Number(data.ai_match_score),
        rationale: (data.ai_match_rationale as string) || null,
        scoredAt: data.ai_scored_at as string | null,
      };
    },
  });
}
