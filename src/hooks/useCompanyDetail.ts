import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Company Profile Deep Relational Sensor
 * CTO Reference: Authoritative controller for pulling employer taxonomic records and listings.
 * Architecture: Digital Workforce enabled - anomaly detection for RPC boundary exceptions.
 * Phase: Z0 Code Freeze Hardened.
 */

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
    // Performance Baseline: Enforce 5-minute cache consistency to maximize high-performance SaaS scaling
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CompanyDetail> => {
      if (!companyName) {
        throw new Error("ID_HYDRATION_FAULT: Target company name required.");
      }

      // HUD: EXECUTING_RPC_RELATIONAL_SYNC
      const { data, error } = await supabase.rpc("get_company_detail", {
        p_company_name: companyName,
      });

      if (error) {
        // Digital Workforce Anomaly Sensor:
        // Critical for the Admin Chat Agent to detect database-level technical exceptions.
        console.error("[Digital Workforce] FAULT: get_company_detail failed taxonomy sync.", {
          companyName,
          error: error.message,
          code: error.code,
        });
        throw new Error(`REGISTRY_SYNC_FAULT: Failed to pull structural employer records. Code: ${error.code}`);
      }

      // Protocol Fallback: Guarantee core layout structure returns to prevent UI shell crashes
      return (
        (data as unknown as CompanyDetail) || {
          header: { company_name: companyName, logo_url: null, active_jobs: 0, jobs_last_14d: 0 },
          locations: [],
          types: [],
          jobs: [],
        }
      );
    },
  });
}
