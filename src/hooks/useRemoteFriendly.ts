import { useQuery } from "@tanstack/react-query";
import { getRemoteFriendlySummary } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: Geographic Decoupling Radar (V5.6.0)
 * CTO Reference: Authoritative telemetry sensor tracking remote workspace density.
 * Architecture: Digital Workforce enabled - logs marketplace data gaps to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface RemoteFriendlyCompany {
  name: string;
  logo_url: string | null;
}

export interface RemoteFriendlySummary {
  active_jobs: number;
  jobs_last_14d: number;
  top_companies: RemoteFriendlyCompany[];
}

/**
 * Fetches an aggregated overview of remote-first opportunities across the marketplace.
 * RPC: get_remote_friendly_summary
 */
export function useRemoteFriendly() {
  return useQuery({
    queryKey: ["remote-friendly-summary"],
    // Performance Baseline: 5-minute stability caching for macro marketplace trends
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RemoteFriendlySummary> => {
      let data: any;
      try {
        data = await getRemoteFriendlySummary();
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_remote_friendly_summary RPC handshake failed.", {
          message: error?.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      // Hardened Data Normalization: Safeguards layout elements against null fields
      const rawData = (data as any) || {};

      const topCompanies: RemoteFriendlyCompany[] = Array.isArray(rawData.top_companies)
        ? rawData.top_companies.map((c: any) => ({
            name: String(c?.name ?? "Confidential Organization"),
            logo_url: c?.logo_url ? String(c.logo_url) : null,
          }))
        : [];

      return {
        active_jobs: Number(rawData.active_jobs ?? 0),
        jobs_last_14d: Number(rawData.jobs_last_14d ?? 0),
        top_companies: topCompanies,
      };
    },
  });
}
