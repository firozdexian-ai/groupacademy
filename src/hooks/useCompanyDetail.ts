import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyDetail {
  header: {
    company_name: string;
    logo_url: string | null;
    active_jobs: number;
    jobs_last_14d: number;
  };
  locations: { location: string; count: number }[];
  types: { type: string; count: number }[];
  jobs: any[];
}

export function useCompanyDetail(companyName: string | null) {
  return useQuery({
    queryKey: ["company-detail", companyName],
    enabled: !!companyName,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_company_detail", { p_company_name: companyName! });
      if (error) throw error;
      return data as unknown as CompanyDetail;
    },
  });
}
