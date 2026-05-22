import { useQuery } from "@tanstack/react-query";
import { getCompaniesWithSignal } from "@/domains/companies/repo/companiesRepo";

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
    queryFn: async (): Promise<CompanyWithSignal[]> => {
      try {
        const data = await getCompaniesWithSignal<CompanyWithSignal[]>({ country: country ?? null, limit });
        return (data as CompanyWithSignal[]) || [];
      } catch (error: any) {
        console.error("[companies] get_companies_with_signal failed", {
          country: country ?? null,
          limit,
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
