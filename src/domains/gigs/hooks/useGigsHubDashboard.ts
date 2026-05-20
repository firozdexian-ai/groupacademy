import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Gigs & Marketplace Command Center (V5.6.0)
 * CTO Reference: Authoritative single-trip aggregation for the Gigs Hub.
 * Architecture: Digital Workforce enabled - logs marketplace sync faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened.
 */

export interface GigsHubDashboard {
  talent_id: string | null;
  featured: any[];
  submission_counts: Record<string, { total: number; pending: number }>;
  my_bids: any[];
  my_contracts: any[];
  top_matches: any[];
  course_projects: any[];
  marketplace_projects: any[];
  generated_at: string;
}

const EMPTY_GENERATED_AT = () => new Date().toISOString();

/**
 * Single-RPC zero-latency dashboard for /app/gigs.
 * Replaces legacy waterfalls to maximize conversion velocity.
 */
export function useGigsHubDashboard(enabled = true) {
  return useQuery({
    queryKey: ["gigs-hub-dashboard"],
    enabled,
    staleTime: 2 * 60 * 1000, // 2-minute performance consistency baseline
    queryFn: async (): Promise<GigsHubDashboard> => {
      // HUD: EXECUTING_MARKETPLACE_AGGREGATION_SYNC
      const { data, error } = await supabase.rpc("get_gigs_hub_dashboard");

      if (error) {
        // Digital Workforce Anomaly Trigger:
        // Direct stream to Admin OS to monitor marketplace liquidity bottlenecks.
        console.error("[Digital Workforce] ANOMALY: get_gigs_hub_dashboard RPC handshake failed.", {
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      // Hardened Data Normalization:
      // Ensures the UI never encounters 'undefined' properties during hydration.
      const d = (data as Partial<GigsHubDashboard>) || {};

      return {
        talent_id: d.talent_id ?? null,
        featured: d.featured ?? [],
        submission_counts: d.submission_counts ?? {},
        my_bids: d.my_bids ?? [],
        my_contracts: d.my_contracts ?? [],
        top_matches: d.top_matches ?? [],
        course_projects: d.course_projects ?? [],
        marketplace_projects: d.marketplace_projects ?? [],
        generated_at: d.generated_at ?? EMPTY_GENERATED_AT(),
      };
    },
  });
}
