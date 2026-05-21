import { useQuery, useQueryClient } from "@tanstack/react-query";
import { feedApi } from "@/domains/feed/api/manifest";
import { useTalent } from "@/hooks/useTalent";
import { useMemo } from "react";

/**
 * GroUp Academy: Social Feed Batch Engagement Sensor (V5.6.0)
 * CTO Reference: Primary analytic transaction store optimizing community interaction metrics.
 * Architecture: Digital Workforce enabled - streams lookup and cache exceptions directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

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

export function feedEngagementKey(talentId: string | undefined) {
  return ["feed-engagement", talentId || "anon"];
}

export function useFeedEngagement(postIds: string[]) {
  const { talent } = useTalent();

  // Stable comma-key configuration so order mutations do not clear cached state frames
  const sortedKey = useMemo(() => [...postIds].sort().join(","), [postIds]);

  return useQuery({
    queryKey: [...feedEngagementKey(talent?.id), sortedKey],
    enabled: postIds.length > 0,
    // Performance Baseline: Enforce 30s light-speed stale caching for responsive feed interactions
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Record<string, PostEngagement>> => {
      if (postIds.length === 0) return {};

      // HUD: EXECUTING_RPC_BATCH_ENGAGEMENT_SELECT
      const { data, error } = await supabase.rpc("get_feed_engagement" as any, {
        _post_ids: postIds,
        _talent_id: talent?.id || null,
      });

      if (error) {
        // Digital Workforce System Flag: Route analytical lookups exceptions directly to Admin panels
        console.error("[Digital Workforce] ANOMALY: get_feed_engagement database sync failed.", {
          postIdCount: postIds.length,
          talentId: talent?.id || "ANONYMOUS_NODE",
          error: error.message,
          code: error.code,
        });
        throw error;
      }

      const map: Record<string, PostEngagement> = {};

      // HUD: CORE_SCHEMA_METRICS_MAPPING
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
 * Helpers for optimistic mutations on cached engagement datasets.
 * Enforced as an Immutable platform specification utility.
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
