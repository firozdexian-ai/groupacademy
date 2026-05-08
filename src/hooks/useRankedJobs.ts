import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobCardData } from "@/components/jobs/JobCard";

export interface RankedJob {
  job: JobCardData & Record<string, any>;
  match_score: number;
  match_reason: "verified_skill" | "profession" | "location_only" | "recency";
  rank_score: number;
}

const PAGE_SIZE = 12;

/**
 * Infinite, deterministic, zero-latency ranked job feed for a talent.
 * Cursor = last page's lowest rank_score (keyset pagination on the SQL side).
 */
export function useRankedJobs(talentId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["ranked-jobs", talentId],
    enabled: !!talentId,
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_ranked_jobs_for_talent", {
        _talent_id: talentId,
        _cursor: pageParam,
        _limit: PAGE_SIZE,
      });
      if (error) throw error;
      return (data ?? []) as RankedJob[];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return Number(lastPage[lastPage.length - 1].rank_score);
    },
    staleTime: 5 * 60 * 1000,
  });
}
