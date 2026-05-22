import { useQuery } from "@tanstack/react-query";
import { getTrendingJobs } from "@/domains/jobs/repo/jobsRepo";
import type { JobCardData } from "@/components/jobs/JobCard";

/**
 * GroUp Academy: Marketplace Velocity & Discovery Engine (V5.6.0)
 * CTO Reference: High-performance data sensor capturing real-time trending jobs.
 * Architecture: Optimized via TanStack Query v5 with strict structural normalization.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

/**
 * Fetches an audited array of high-engagement, trending opportunities across the cluster.
 * RPC: get_trending_jobs
 */
export function useTrendingJobs(limit = 10) {
  return useQuery<JobCardData[], Error>({
    queryKey: ["trending-jobs", limit],
    // Performance Baseline: 2-minute stability window safeguarding database aggregate computations
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<JobCardData[]> => {
      // HUD: EXECUTING_TRENDING_JOBS_RPC_INGRESS_SYNC
      let data: any[];
      try {
        data = await getTrendingJobs(limit);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_trending_jobs RPC aggregation failed.", {
          limit,
          message: error?.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }


      // Hardened Data Normalization Layer: Sanitizes raw database variables against schema anomalies
      return (data || []).map((row: any) => ({
        id: String(row.id ?? ""),
        title: String(row.title ?? "Untitled Position"),
        company_name: String(row.company_name ?? "Confidential Organization"),
        company_logo_url: row.company_logo_url ? String(row.company_logo_url) : null,
        location: String(row.location ?? "Remote / Flexible"),
        job_type: String(row.job_type ?? "Full-time"),
        salary_min: row.salary_min !== undefined && row.salary_min !== null ? Number(row.salary_min) : null,
        salary_max: row.salary_max !== undefined && row.salary_max !== null ? Number(row.salary_max) : null,
        currency: String(row.currency ?? "USD"),
        skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
        created_at: String(row.created_at ?? new Date().toISOString()),
      }));
    },
  });
}
