import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurrencyRate } from "@/lib/currency";

/**
 * GroUp Academy: FX Localization & Currency Sensor
 * CTO Reference: Authoritative resource store tracking currency aggregation rates.
 * Architecture: Digital Workforce enabled - streams lookup errors to the Admin Command Center.
 * Phase: Z0 Code Freeze Hardened.
 */

export function useCurrencyRates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["currency-rates"],
    // Performance Baseline: Enforce 1-hour stability caching to protect database resources
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<CurrencyRate[]> => {
      let data: any[] = [];
      try {
        data = await listActiveCurrencyRates();
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: currency_rates schema synchronization failure.", {
          code: error?.code,
          message: error?.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      return data as unknown as CurrencyRate[];
    },
  });

  return {
    rates: data ?? [],
    isLoading,
    queryError: error,
  };
}
