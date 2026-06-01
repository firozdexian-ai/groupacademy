/**
 * GroUp Academy: Algorithmic Match Distribution Engine (V5.6.0)
 * CTO Reference: High-performance infinite scroller tracking keyset-paginated jobs.
 * Architecture: Digital Workforce enabled - streams pipeline exceptions to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { getRankedJobsForTalent } from "@/domains/jobs/repo/jobsRepo";
import type { JobCardData } from "@/domains/jobs/components/JobCard";
import { trackError, trackEvent } from "@/lib/errorTracking";

export type MatchReasonType = "verified_skill" | "profession" | "location_only" | "recency";

export interface RankedJob {
  job: JobCardData;
  match_score: number;
  match_reason: MatchReasonType;
  rank_score: number;
}

const PAGE_SIZE = 12;

/**
 * Infinite, deterministic ranked job feed tailored to specific talent capability sets.
 * RPC: get_ranked_jobs_for_talent
 */
export function useRankedJobs(talentId: string | undefined) {
  return useInfiniteQuery<
    RankedJob[],
    Error,
    InfiniteData<RankedJob[], number | null>,
    [string, string | undefined],
    number | null
  >({
    queryKey: ["ranked-jobs", talentId],
    enabled: !!talentId,
    // Performance Baseline: 5-minute cache consistency window for algorithmic feeds
    staleTime: 5 * 60 * 1000,
    initialPageParam: null as number | null,
    queryFn: async (context): Promise<RankedJob[]> => {
      const { pageParam } = context;

      let data: any[];
      try {
        data = await getRankedJobsForTalent({
          talentId: talentId!,
          cursor: pageParam,
          limit: PAGE_SIZE,
        });
      } catch (error: any) {
        // Digital Workforce: Route data drops directly to platform telemetry layers
        trackError(error, {
          component: "useRankedJobs",
          action: "get_ranked_jobs_for_talent_rpc_failed",
          talentId,
          cursor: pageParam,
        });
        throw error;
      }

      // Hardened Data Normalization Layer: Prevents layout breaking from schema shifts
      return (data || []).map((row: any) => {
        const rawJob = row.job || {};

        // Defensive reconstruction of JobCardData mapping specs
        const normalizedJob: JobCardData = {
          id: String(rawJob.id ?? ""),
          title: String(rawJob.title ?? "Untitled Position"),
          company_name: String(rawJob.company_name ?? "Confidential Organization"),
          company_logo_url: rawJob.company_logo_url ?? null,
          location: String(rawJob.location ?? "Remote / Flexible"),
          job_type: String(rawJob.job_type ?? "Full-time"),
          salary_range_min: rawJob.salary_min ?? rawJob.salary_range_min ?? null,
          salary_range_max: rawJob.salary_max ?? rawJob.salary_range_max ?? null,
          salary_currency: rawJob.currency ?? rawJob.salary_currency ?? "USD",
          created_at: String(rawJob.created_at ?? new Date().toISOString()),
        };

        const rawReason = String(row.match_reason ?? "recency");
        const matchReason: MatchReasonType =
          rawReason === "verified_skill" ||
          rawReason === "profession" ||
          rawReason === "location_only" ||
          rawReason === "recency"
            ? rawReason
            : "recency";

        return {
          job: normalizedJob,
          match_score: Number(row.match_score ?? 0),
          match_reason: matchReason,
          rank_score: Number(row.rank_score ?? 0),
        };
      });
    },
    getNextPageParam: (lastPage): number | undefined => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;

      // Keyset Anchor: Target the last item's rank_score to dictate subsequent query boundaries
      const trailingNode = lastPage[lastPage.length - 1];
      return typeof trailingNode.rank_score === "number" ? trailingNode.rank_score : undefined;
    },
  });
}
