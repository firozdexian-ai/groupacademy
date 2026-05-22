import { useQuery } from "@tanstack/react-query";
import { getJobsInField } from "@/domains/jobs/repo/jobsRepo";
import type { JobCardData } from "@/components/jobs/JobCard";

/**
 * GroUp Academy: Career Field Discovery Sensor (V5.6.0)
 * CTO Reference: High-precision matching between talent skill-tags and job vacancies.
 * Architecture: Digital Workforce enabled - logs alignment gaps to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

/**
 * Fetches jobs specifically aligned with the talent's verified field of expertise.
 * RPC: get_jobs_in_field
 */
export function useJobsInField(talentId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ["jobs-in-field", talentId, limit],
    enabled: !!talentId,
    // Performance Baseline: 5-minute stability caching for field discovery
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<JobCardData[]> => {
      // HUD: EXECUTING_FIELD_AFFINITY_MATCHING_SYNC
      try {
        const data = await getJobsInField({ talentId: talentId!, limit });
        return (data || []) as JobCardData[];
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_jobs_in_field RPC handshake failed.", {
          talentId,
          limit,
          error: error?.message,
        });
        throw error;
      }
    },
  });
}
