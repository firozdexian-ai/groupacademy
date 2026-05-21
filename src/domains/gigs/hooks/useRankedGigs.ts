import { useInfiniteQuery } from "@tanstack/react-query";
import { getRankedGigsForTalent } from "@/domains/gigs/repo/gigsRepo";

/**
 * GroUp Academy: Keyset Gig Feed Aggregator (V5.6.0)
 * CTO Reference: Authoritative infinite scroller mapping gig matching matrices.
 * Architecture: Digital Workforce enabled - logs marketplace data gaps to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface RankedGig {
  gig_id: string;
  kind: string;
  title: string;
  description: string | null;
  skill_category: string | null;
  credits: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  rank_score: number;
  match_score: number;
}

const PAGE_SIZE = 12;

/**
 * Infinite, keyset-paginated unified marketplace feed.
 * RPC: get_ranked_gigs_for_talent
 */
export function useRankedGigs(talentId: string | null | undefined) {
  return useInfiniteQuery<RankedGig[], Error, InfiniteDataWrapper, [string, string | null], number | null>({
    queryKey: ["ranked-gigs", talentId ?? null],
    initialPageParam: null as number | null,
    // Performance Baseline: 3-minute stability caching for mid-frequency discovery feeds
    staleTime: 3 * 60 * 1000,
    queryFn: async (context): Promise<RankedGig[]> => {
      const { pageParam } = context;

      // HUD: EXECUTING_KEYSET_PAGINATED_GIG_INGRESS
      let data: any[];
      try {
        data = await getRankedGigsForTalent({
          talentId: talentId ?? null,
          cursor: pageParam,
          limit: PAGE_SIZE,
        });
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_ranked_gigs_for_talent RPC lookup failed.", {
          talentId: talentId ?? "ANONYMOUS",
          cursor: pageParam,
          message: error?.message,
        });
        throw error;
      }

      // Hardened Normalization Layer to shield layout structures against schema drifts
      return (data || []).map((row: any) => ({
        gig_id: String(row.gig_id ?? ""),
        kind: String(row.kind ?? "standard"),
        title: String(row.title ?? "Untitled Opportunity"),
        description: row.description ?? null,
        skill_category: row.skill_category ?? null,
        credits: row.credits !== undefined && row.credits !== null ? Number(row.credits) : null,
        deadline: row.deadline ?? null,
        status: String(row.status ?? "open"),
        created_at: String(row.created_at ?? new Date().toISOString()),
        rank_score: Number(row.rank_score ?? 0),
        match_score: Number(row.match_score ?? 0),
      }));
    },
    getNextPageParam: (lastPage): number | undefined => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;

      // Keyset Pagination: Extract the final element's score to anchor the next page window
      const finalElement = lastPage[lastPage.length - 1];
      return typeof finalElement.rank_score === "number" ? finalElement.rank_score : undefined;
    },
  });
}

// Internal type helper targeting clean infinite structure alignment
type InfiniteDataWrapper = import("@tanstack/react-query").InfiniteData<RankedGig[], number | null>;
