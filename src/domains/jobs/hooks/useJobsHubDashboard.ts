import { useQuery } from "@tanstack/react-query";
import { getJobsHubDashboard } from "@/domains/jobs/repo/jobsRepo";
import type { JobCardData } from "@/components/jobs/JobCard";
import type { CompanyWithSignal } from "@/domains/companies/hooks/useCompaniesWithSignal";
import type { CountryWithSignal } from "@/hooks/useCountriesWithSignal";
import type { RemoteFriendlySummary } from "@/hooks/useRemoteFriendly";

/**
 * GroUp Academy: Jobs Marketplace Aggregator (V5.6.0)
 * CTO Reference: Authoritative single-trip dashboard sensor for /app/jobs discovery.
 * Architecture: Digital Workforce enabled - logs marketplace sync faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export interface JobsHubDashboard {
  trending: JobCardData[];
  in_field: JobCardData[];
  companies: CompanyWithSignal[];
  countries: CountryWithSignal[];
  remote: RemoteFriendlySummary;
  type_counts: Record<string, number>;
}

const EMPTY_REMOTE: RemoteFriendlySummary = {
  active_jobs: 0,
  jobs_last_14d: 0,
  top_companies: [],
};

/**
 * Fetches a consolidated marketplace snapshot.
 * Replaces legacy waterfall hooks to maximize conversion velocity.
 */
export function useJobsHubDashboard(talentId: string | undefined) {
  return useQuery({
    queryKey: ["jobs-hub-dashboard", talentId ?? null],
    // Performance Baseline: 3-minute stability caching for hub discovery
    staleTime: 3 * 60 * 1000,
    queryFn: async (): Promise<JobsHubDashboard> => {
      // HUD: EXECUTING_JOBS_HUB_AGGREGATION_SYNC
      let data: any;
      try {
        data = await getJobsHubDashboard(talentId ?? null);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_jobs_hub_dashboard RPC handshake failed.", {
          talentId,
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }

      // Hardened Data Normalization:
      // Protects downstream UI components from 'undefined' property access.
      const d = (data as Partial<JobsHubDashboard>) || {};

      return {
        trending: d.trending ?? [],
        in_field: d.in_field ?? [],
        companies: d.companies ?? [],
        countries: d.countries ?? [],
        remote: d.remote ?? EMPTY_REMOTE,
        type_counts: d.type_counts ?? {},
      };
    },
  });
}
