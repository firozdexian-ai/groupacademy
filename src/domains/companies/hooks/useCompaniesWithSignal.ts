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
        console.error("[Digital Workforce] FAULT: get_companies_with_signal failed sync.", {
          countryFilter: country ?? "GLOBAL_NODE",
          limitValue: limit,
          error: error?.message,
          code: error?.code,
        });
        throw new Error(`REGISTRY_SYNC_FAULT: Failed to resolve employer market telemetry. Code: ${error?.code}`);
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
