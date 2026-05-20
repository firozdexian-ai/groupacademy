import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Employer Signal Intelligence Engine
 * CTO Reference: Authoritative controller for evaluating B2B hiring telemetry.
 * Architecture: Digital Workforce enabled - anomaly detection on data layer dropouts.
 * Phase: Z0 Code Freeze Hardened.
 */

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
      // HUD: EXECUTING_RPC_HANDSHAKE
      const { data, error } = await supabase.rpc("get_companies_with_signal", {
        p_country: country ?? null,
        p_limit: limit,
      });

      if (error) {
        // Digital Workforce Anomaly Sensor:
        // Critical for the Admin Chat Agent to detect database-level technical exceptions.
        console.error("[Digital Workforce] FAULT: get_companies_with_signal failed sync.", {
          countryFilter: country ?? "GLOBAL_NODE",
          limitValue: limit,
          error: error.message,
          code: error.code,
        });
        throw new Error(`REGISTRY_SYNC_FAULT: Failed to resolve employer market telemetry. Code: ${error.code}`);
      }

      // Protocol Fallback: Guarantee an array structure returns to prevent UI crashes in active grids
      return (data as CompanyWithSignal[]) || [];
    },
    // Performance baseline: Enforce 5-minute stability caching to protect compute budgets
    staleTime: 5 * 60 * 1000,
  });
}
