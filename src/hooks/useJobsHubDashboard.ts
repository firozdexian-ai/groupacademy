import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobCardData } from "@/components/jobs/JobCard";
import type { CompanyWithSignal } from "@/hooks/useCompaniesWithSignal";
import type { CountryWithSignal } from "@/hooks/useCountriesWithSignal";
import type { RemoteFriendlySummary } from "@/hooks/useRemoteFriendly";

export interface JobsHubDashboard {
  trending: JobCardData[];
  in_field: JobCardData[];
  companies: CompanyWithSignal[];
  countries: CountryWithSignal[];
  remote: RemoteFriendlySummary;
  type_counts: Record<string, number>;
}

const EMPTY: JobsHubDashboard = {
  trending: [],
  in_field: [],
  companies: [],
  countries: [],
  remote: { active_jobs: 0, jobs_last_14d: 0, top_companies: [] },
  type_counts: {},
};

/**
 * Single-round-trip dashboard fetch for /app/jobs.
 * Replaces 6 separate hooks with one consolidated RPC.
 */
export function useJobsHubDashboard(talentId: string | undefined) {
  return useQuery({
    queryKey: ["jobs-hub-dashboard", talentId ?? null],
    queryFn: async (): Promise<JobsHubDashboard> => {
      const { data, error } = await supabase.rpc("get_jobs_hub_dashboard", {
        _talent_id: talentId ?? null,
      });
      if (error) throw error;
      const d = (data as any) ?? {};
      return {
        trending: d.trending ?? [],
        in_field: d.in_field ?? [],
        companies: d.companies ?? [],
        countries: d.countries ?? [],
        remote: d.remote ?? EMPTY.remote,
        type_counts: d.type_counts ?? {},
      };
    },
    staleTime: 3 * 60 * 1000,
  });
}
