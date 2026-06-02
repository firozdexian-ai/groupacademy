import { useCallback, useMemo, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { insertPollVote } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useFeedEngagement, patchEngagementCache } from "@/domains/feed/hooks/useFeedEngagement";

interface PollResult {
  optionId: string;
  votes: number;
  percentage: number;
}

interface UsePollVotingResult {
  hasVoted: boolean;
  userVote: string | null;
  results: PollResult[];
  totalVotes: number;
  castVote: (optionId: string) => void;
  isLoading: boolean;
}

const TAP_LOCK_MS = 200;

/**
 * Custom state manager hook handling interactive community poll submissions.
 * Subscribes to shared batched cache states and leverages optimistic layout adjustments with rollbacks.
 */
export function usePollVoting(postId: string, options: { id: string; text: string }[]): UsePollVotingResult {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastTap = useRef(0);

  // Extract shared engagement datasets linked across index viewports
  const { data: engagementMap } = useFeedEngagement([postId]);
  const eng = engagementMap?.[postId];
  const voteCounts = eng?.pollCounts || {};
  const userVote = eng?.userVote || null;
  const hasVoted = !!userVote;

  // Calculate cumulative interaction statistics
  const totalVotes = useMemo(
    () => Object.values(voteCounts).reduce((sum: number, current: any) => sum + Number(current || 0), 0),
    [voteCounts],
  );

  // Compute option selections into percentage ratios safely
  const results: PollResult[] = useMemo(
    () =>
      options.map((opt) => {
        const votes = Number(voteCounts[opt.id] || 0);
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return { optionId: opt.id, votes, percentage };
      }),
    [options, voteCounts, totalVotes],
  );

  // Manage transaction logic loop mutations with validation handlers
  const mutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!talent?.id) throw new Error("Authentication required.");
      await insertPollVote({ postId, talentId: talent.id, optionId });
    },
    onMutate: async (optionId) => {
      if (!talent?.id) return;

      // Apply immediate optimistic value updates to protect interaction responsiveness
      patchEngagementCache(queryClient, talent.id, postId, (curr) => ({
        ...curr,
        pollCounts: { ...curr.pollCounts, [optionId]: Number(curr.pollCounts[optionId] || 0) + 1 },
        userVote: optionId,
      }));
    },
    onSuccess: () => {
      toast({ title: "Vote recorded", description: "Your vote has been recorded." });
    },
    onError: (err: any, optionId) => {
      if (!talent?.id) return;

      // Log transaction execution failures to operational diagnostic panels
      console.error("Poll submission process failed to synchronize:", {
        postId,
        optionId,
        message: err.message,
      });

      // Roll back optimistic modifications instantly upon transaction rejection
      patchEngagementCache(queryClient, talent.id, postId, (curr) => ({
        ...curr,
        pollCounts: {
          ...curr.pollCounts,
          [optionId]: Math.max(0, Number(curr.pollCounts[optionId] || 0) - 1),
        },
        userVote: null,
      }));

      toast({
        title: "Could not register vote",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Re-validate cache states to synchronize exact values from source tables
      queryClient.invalidateQueries({ queryKey: ["feed-engagement", [postId]] });
    },
  });

  const castVote = useCallback(
    (optionId: string) => {
      const now = Date.now();
      if (now - lastTap.current < TAP_LOCK_MS) return;
      lastTap.current = now;

      if (!talent?.id) {
        toast({ title: "Sign in required", description: "Sign in to vote.", variant: "destructive" });
        return;
      }
      if (hasVoted) {
        toast({ title: "Already voted", description: "Your vote is already recorded." });
        return;
      }

      mutation.mutate(optionId);
    },
    [talent?.id, hasVoted, mutation, toast],
  );

  return {
    hasVoted,
    userVote,
    results,
    totalVotes,
    castVote,
    isLoading: mutation.isPending,
  };
}