import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyWithSignal {
  company_name: string;
  logo_url: string | null;
  active_jobs: number;
  jobs_last_14d: number;
  top_location: string | null;
  top_type: string | null;
}

export function useCompaniesWithSignal(country?: string | null, limit = 100) {
  return useQuery({
    queryKey: ["companies-signal", country ?? null, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_companies_with_signal", {
        p_country: country ?? null,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as CompanyWithSignal[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
