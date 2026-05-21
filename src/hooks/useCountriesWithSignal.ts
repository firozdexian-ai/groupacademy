import { useQuery } from "@tanstack/react-query";
import { getCountriesWithSignal } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: Geographic Market Intelligence Hook
 * CTO Reference: Authoritative sensor for international job market signaling.
 * Architecture: Digital Workforce enabled - anomaly monitoring on aggregation drops.
 * Phase: Z0 Code Freeze Hardened.
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
    // Performance Baseline: Enforce 5-minute stability caching to safeguard compute budgets
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CountryWithSignal[]> => {
      // HUD: EXECUTING_RPC_GEOGRAPHIC_SYNC
      // Hardened parameters mapping explicit types matching database public schema specs
      const { data, error } = await supabase.rpc("get_countries_with_signal", {
        p_limit: limit,
      });

      if (error) {
        // Digital Workforce Anomaly Sensor:
        // Automatically formats core failures for real-time aggregation by Admin Chat bots.
        console.error("[Digital Workforce] ANOMALY: get_countries_with_signal query failed sync.", {
          limitSetting: limit,
          error: error.message,
          code: error.code,
        });
        throw new Error(`REGISTRY_SYNC_FAULT: Failed to pull geographic signal metrics. Code: ${error.code}`);
      }

      // Protocol Fallback: Guarantee clean object serialization array to protect SaaS UI tables
      return (data ?? []) as CountryWithSignal[];
    },
  });
}
