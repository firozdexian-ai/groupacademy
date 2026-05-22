import { useCallback, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { deletePostReaction, insertPostReaction } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useFeedEngagement, patchEngagementCache, EMPTY_REACTIONS, type ReactionType } from "@/domains/feed/hooks/useFeedEngagement";

/**
 * GroUp Academy: Social Feed Reaction Engine (V5.6.0)
 * CTO Reference: High-performance, optimistically updated interaction sensor.
 * Architecture: Digital Workforce enabled - streams transactional errors to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export type { ReactionType };

interface UsePostReactionsResult {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  toggleReaction: (type: ReactionType) => void;
  isLoading: boolean;
}

const TAP_LOCK_MS = 200;

export function usePostReactions(postId: string): UsePostReactionsResult {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastTap = useRef(0);

  // Subscribe to shared cache (batched RPC fills it)
  const { data: engagementMap } = useFeedEngagement([postId]);
  const eng = engagementMap?.[postId];
  const reactions = eng?.reactionCounts || EMPTY_REACTIONS;
  const userReaction = eng?.userReaction || null;

  // --- ACTION: ATOMIC_REACTION_MUTATION ---
  const mutation = useMutation({
    mutationFn: async ({
      type,
      isToggleOff,
      prevUserReaction,
    }: {
      type: ReactionType;
      isToggleOff: boolean;
      prevUserReaction: ReactionType | null;
    }) => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED");

      // HUD: EXECUTING_DB_REACTION_TRANSACTION
      if (isToggleOff) {
        const { error } = await deletePostReaction({ postId, talentId: talent.id });
        if (error) throw error;
      } else {
        if (prevUserReaction) {
          await deletePostReaction({ postId, talentId: talent.id });
        }
        const { error } = await insertPostReaction({
          postId,
          talentId: talent.id,
          reactionType: type,
        });
        if (error) throw error;
      }
    },
    onMutate: async ({ type, isToggleOff, prevUserReaction }) => {
      if (!talent?.id) return;

      // HUD: OPTIMISTIC_CACHE_PATCH_APPLY
      patchEngagementCache(queryClient, talent.id, postId, (curr) => {
        const next = { ...curr, reactionCounts: { ...curr.reactionCounts } };
        if (isToggleOff) {
          next.reactionCounts[type] = Math.max(0, next.reactionCounts[type] - 1);
          next.userReaction = null;
        } else {
          if (prevUserReaction) {
            next.reactionCounts[prevUserReaction] = Math.max(0, next.reactionCounts[prevUserReaction] - 1);
          }
          next.reactionCounts[type] = (next.reactionCounts[type] || 0) + 1;
          next.userReaction = type;
        }
        return next;
      });
    },
    onError: (err: any, { type, isToggleOff, prevUserReaction }) => {
      if (!talent?.id) return;

      // Digital Workforce Anomaly Trigger: Logs pipeline failures to background admin sweepers
      console.error("[Digital Workforce] ANOMALY: post_reactions state reconciliation failed.", {
        postId,
        type,
        message: err.message,
      });

      // HUD: OPTIMISTIC_CACHE_PATCH_ROLLBACK
      patchEngagementCache(queryClient, talent.id, postId, (curr) => {
        const next = { ...curr, reactionCounts: { ...curr.reactionCounts } };
        if (isToggleOff) {
          next.reactionCounts[type] = (next.reactionCounts[type] || 0) + 1;
          next.userReaction = type;
        } else {
          next.reactionCounts[type] = Math.max(0, next.reactionCounts[type] - 1);
          if (prevUserReaction) {
            next.reactionCounts[prevUserReaction] = (next.reactionCounts[prevUserReaction] || 0) + 1;
          }
          next.userReaction = prevUserReaction;
        }
        return next;
      });

      toast({
        title: "Connection sync failed",
        description: "Your reaction could not be saved. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Re-sync with primary engagement maps to preserve ledger finality
      queryClient.invalidateQueries({ queryKey: ["feed-engagement", [postId]] });
    },
  });

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      const now = Date.now();
      if (now - lastTap.current < TAP_LOCK_MS) return;
      lastTap.current = now;

      if (!talent?.id) {
        toast({ title: "Sign in required", description: "Sign in to react.", variant: "destructive" });
        return;
      }

      const isToggleOff = userReaction === type;
      mutation.mutate({ type, isToggleOff, prevUserReaction: userReaction });
    },
    [talent?.id, userReaction, mutation, toast],
  );

  return {
    reactions,
    userReaction,
    toggleReaction,
    isLoading: mutation.isPending,
  };
}
