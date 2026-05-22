import { useQuery } from "@tanstack/react-query";
import { getCountriesWithSignal } from "@/domains/jobs/repo/jobsRepo";

/**
 * Geographic job market signal — country-level counts, top cities, and top employers.
 */

export interface CountryWithSignal {
  country: string;
  active_jobs: number;
  jobs_last_14d: number;
  top_cities: { name: string; count: number }[];
  top_companies: { name: string; logo_url: string | null }[];
}

export function useCountriesWithSignal(limit = 50) {
  return useQuery({
    queryKey: ["countries-signal-global", limit],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CountryWithSignal[]> => {
      try {
        const data = await getCountriesWithSignal(limit);
        return (data ?? []) as CountryWithSignal[];
      } catch (error: any) {
        console.error("[countries] get_countries_with_signal failed", {
          limit,
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },
  });
}
