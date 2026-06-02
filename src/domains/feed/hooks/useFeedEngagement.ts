import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFeedEngagement } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { useMemo } from "react";

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

export interface PostEngagement {
  reactionCounts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  pollCounts: Record<string, number>;
  userVote: string | null;
}

const EMPTY_REACTIONS: Record<ReactionType, number> = {
  like: 0,
  insightful: 0,
  celebrate: 0,
  support: 0,
};

/**
 * Generates the base cache query key structure for feed engagement statistics.
 */
export function feedEngagementKey(talentId: string | undefined) {
  return ["feed-engagement", talentId || "anonymous"];
}

/**
 * Custom hook to batch fetch engagement and interaction datasets for an array of feed items.
 * Minimizes network round-trips by bundling user reactions and poll counts into a unified state query.
 */
export function useFeedEngagement(postIds: string[]) {
  const { talent } = useTalent();

  // Stabilize array parameter identities to prevent redundant query cache execution loops
  const sortedKey = useMemo(() => [...postIds].sort().join(","), [postIds]);

  return useQuery({
    queryKey: [...feedEngagementKey(talent?.id), sortedKey],
    enabled: postIds.length > 0,
    staleTime: 1000 * 30, // 30-second stale configuration threshold for active feeds
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Record<string, PostEngagement>> => {
      if (postIds.length === 0) return {};

      let data: any[] = [];
      try {
        data = (await getFeedEngagement({
          _post_ids: postIds,
          _talent_id: talent?.id || null,
        })) as any[];
      } catch (error: any) {
        console.error("Error fetching feed engagement statistics:", {
          postIdCount: postIds.length,
          talentId: talent?.id || "anonymous",
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }

      const map: Record<string, PostEngagement> = {};

      // Map raw backend schema keys cleanly to local component property interfaces
      (data || []).forEach((row: any) => {
        const rc = row.reaction_counts || {};
        map[row.post_id] = {
          reactionCounts: {
            like: Number(rc.like || 0),
            insightful: Number(rc.insightful || 0),
            celebrate: Number(rc.celebrate || 0),
            support: Number(rc.support || 0),
          },
          userReaction: (row.user_reaction as ReactionType) || null,
          pollCounts: row.poll_counts || {},
          userVote: row.user_vote || null,
        };
      });

      return map;
    },
  });
}

/**
 * Helper utility to perform multi-key optimistic cache state adjustments.
 * Updates target posts across query boundaries to prevent interface flickering on interactions.
 */
export function patchEngagementCache(
  queryClient: ReturnType<typeof useQueryClient>,
  talentId: string | undefined,
  postId: string,
  patch: (curr: PostEngagement) => PostEngagement,
) {
  const prefix = feedEngagementKey(talentId);
  const queries = queryClient.getQueriesData<Record<string, PostEngagement>>({ queryKey: prefix });

  queries.forEach(([key, data]) => {
    if (!data) return;
    const curr = data[postId] || {
      reactionCounts: { ...EMPTY_REACTIONS },
      userReaction: null,
      pollCounts: {},
      userVote: null,
    };
    queryClient.setQueryData(key, { ...data, [postId]: patch(curr) });
  });
}

export { EMPTY_REACTIONS };