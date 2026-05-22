import { useQuery } from "@tanstack/react-query";
import { countJobsByType } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: Market Liquidity Sensor (V5.6.0)
 * CTO Reference: Authoritative counter for job distribution across employment types.
 * Architecture: Digital Workforce enabled - logs marketplace data gaps to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

/**
 * Fetches an aggregated map of job counts categorized by employment type.
 * RPC: count_jobs_by_type
 */
export function useJobTypeCounts(country?: string | null) {
  return useQuery({
    queryKey: ["job-type-counts", country || "all"],
    // Performance Baseline: 5-minute stability caching for macro metrics
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Record<string, number>> => {
      // HUD: EXECUTING_JOB_SEGMENT_AGGREGATION_SYNC
      const { data, error } = await supabase.rpc("count_jobs_by_type", {
        _country: country || null,
      });

      if (error) {
        // Digital Workforce Anomaly Trigger:
        // Critical for monitoring background indexing health.
        console.error("[Digital Workforce] ANOMALY: count_jobs_by_type RPC handshake failed.", {
          country: country || "GLOBAL",
          error: error.message,
        });
        throw error;
      }

      const map: Record<string, number> = {};

      // HUD: CORE_METRICS_MAPPING
      (data || []).forEach((row: { job_type: string; cnt: string | number }) => {
        if (row.job_type) {
          map[row.job_type] = Number(row.cnt || 0);
        }
      });

      return map;
    },
  });
}
