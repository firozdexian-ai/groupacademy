import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CountryWithSignal {
  country: string;
  active_jobs: number;
  jobs_last_14d: number;
  top_cities: { name: string; count: number }[];
  top_companies: { name: string; logo_url: string | null }[];
}

export function useCountriesWithSignal(limit = 50) {
  return useQuery({
    queryKey: ["countries-signal", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_countries_with_signal", { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as CountryWithSignal[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
