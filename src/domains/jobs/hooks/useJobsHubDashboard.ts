import { useQuery } from "@tanstack/react-query";
import { getJobsHubDashboard } from "@/domains/jobs/repo/jobsRepo";
import type { JobCardData } from "@/domains/jobs/components/JobCard";
import type { CompanyWithSignal } from "@/domains/companies/hooks/useCompaniesWithSignal";
import type { CountryWithSignal } from "@/hooks/useCountriesWithSignal";
import type { RemoteFriendlySummary } from "@/hooks/useRemoteFriendly";

/**
 * Single-RPC dashboard fetch for /app/jobs discovery.
 * Returns trending jobs, in-field jobs, top companies, top countries, remote summary, and type counts.
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
 * Fetches a consolidated jobs hub snapshot in a single round-trip.
 */
export function useJobsHubDashboard(talentId: string | undefined) {
  return useQuery({
    queryKey: ["jobs-hub-dashboard", talentId ?? null],
    staleTime: 3 * 60 * 1000,
    queryFn: async (): Promise<JobsHubDashboard> => {
      let data: any;
      try {
        data = await getJobsHubDashboard(talentId ?? null);
      } catch (error: any) {
        console.error("[jobs-hub] get_jobs_hub_dashboard failed", {
          talentId,
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }

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
