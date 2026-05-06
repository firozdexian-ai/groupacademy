import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Read-only fetch of a previously cached AI match score for this user × job.
 * No credits spent. Returns null if the user hasn't been scored yet.
 */
export function useJobMatchCached(jobId: string | undefined, talentId: string | undefined) {
  return useQuery({
    queryKey: ["job-match-cached", jobId, talentId],
    queryFn: async () => {
      if (!jobId || !talentId) return null;
      const { data } = await (supabase as any)
        .from("job_applications")
        .select("ai_match_score, ai_match_rationale, ai_scored_at")
        .eq("job_id", jobId)
        .eq("talent_id", talentId)
        .maybeSingle();
      if (data?.ai_match_score == null) return null;
      return {
        score: Number(data.ai_match_score),
        rationale: (data.ai_match_rationale as string) || null,
        scoredAt: data.ai_scored_at as string | null,
      };
    },
    enabled: !!jobId && !!talentId,
    staleTime: 5 * 60_000,
  });
}
