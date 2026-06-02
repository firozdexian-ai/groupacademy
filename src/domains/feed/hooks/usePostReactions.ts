import { useCallback, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { deletePostReaction, insertPostReaction } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useFeedEngagement, patchEngagementCache, EMPTY_REACTIONS, type ReactionType } from "@/domains/feed/hooks/useFeedEngagement";

export type { ReactionType };

interface UsePostReactionsResult {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  toggleReaction: (type: ReactionType) => void;
  isLoading: boolean;
}

const TAP_LOCK_MS = 200;

/**
 * Custom state manager hook handling social feed reaction metrics.
 * Combines optimistic local UI counters with automated cache rollback logic on failure.
 */
export function usePostReactions(postId: string): UsePostReactionsResult {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastTap = useRef(0);

  // Subscribe to the shared query map filled by batched feed entries
  const { data: engagementMap } = useFeedEngagement([postId]);
  const eng = engagementMap?.[postId];
  const reactions = eng?.reactionCounts || EMPTY_REACTIONS;
  const userReaction = eng?.userReaction || null;

  // Mutation logic loop processing remote database writes
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
      if (!talent?.id) throw new Error("Authentication required.");

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

      // Optimistically update the reactive query map state cache
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

      // Digital Workforce anomaly logging for structural auditing
      console.error("Feed reaction update execution process failed to synchronize:", {
        postId,
        type,
        message: err.message,
      });

      // Revert cache to historical coordinates upon transaction rejection
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
        title: "Could not save reaction",
        description: "Your selection could not be synchronized. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Re-validate tracking data queries to guarantee final balance accuracy
      queryClient.invalidateQueries({ queryKey: ["feed-engagement", [postId]] });
    },
  });

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      const now = Date.now();
      if (now - lastTap.current < TAP_LOCK_MS) return;
      lastTap.current = now;

      if (!talent?.id) {
        toast({ title: "Sign in required", description: "Please sign in to react to posts.", variant: "destructive" });
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