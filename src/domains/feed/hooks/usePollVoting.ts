import { useCallback, useMemo, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { insertPollVote } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useFeedEngagement, patchEngagementCache } from "@/domains/feed/hooks/useFeedEngagement";

/**
 * GroUp Academy: Feed Poll Analytics Engine (V5.6.0)
 * CTO Reference: High-performance, error-isolated voting transaction sensor.
 * Architecture: Digital Workforce enabled - streams transactional errors to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

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

export function usePollVoting(postId: string, options: { id: string; text: string }[]): UsePollVotingResult {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastTap = useRef(0);

  // Subscribe to shared cache map driven by batched feeds
  const { data: engagementMap } = useFeedEngagement([postId]);
  const eng = engagementMap?.[postId];
  const voteCounts = eng?.pollCounts || {};
  const userVote = eng?.userVote || null;
  const hasVoted = !!userVote;

  // --- ANALYSIS: RUNTIME DATA COMPILATION ---
  const totalVotes = useMemo(
    () => Object.values(voteCounts).reduce((s: number, n: any) => s + Number(n || 0), 0),
    [voteCounts],
  );

  const results: PollResult[] = useMemo(
    () =>
      options.map((opt) => {
        const votes = Number(voteCounts[opt.id] || 0);
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return { optionId: opt.id, votes, percentage };
      }),
    [options, voteCounts, totalVotes],
  );

  // --- ACTION: TRANSACTION_ISOLATED_MUTATION ---
  const mutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED");

      // HUD: EXECUTING_POLL_VOTE_INSERTION
      await insertPollVote({ postId, talentId: talent.id, optionId });
    },
    onMutate: async (optionId) => {
      if (!talent?.id) return;

      // HUD: APPLYING_OPTIMISTIC_VOTE_METRICS
      patchEngagementCache(queryClient, talent.id, postId, (curr) => ({
        ...curr,
        pollCounts: { ...curr.pollCounts, [optionId]: Number(curr.pollCounts[optionId] || 0) + 1 },
        userVote: optionId,
      }));
    },
    onSuccess: () => {
      toast({ title: "Vote recorded", description: "Your feedback was logged across the cluster." });
    },
    onError: (err: any, optionId) => {
      if (!talent?.id) return;

      // Digital Workforce Anomaly Trigger: Dispatches trace packets straight to background auditors
      console.error("[Digital Workforce] ANOMALY: poll_votes transaction processing dropped.", {
        postId,
        optionId,
        message: err.message,
      });

      // HUD: ROLLBACK_OPTIMISTIC_VOTE_METRICS
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
        description: "Network transaction failed. Please attempt entry again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Systematically re-validate target post boundaries to lock down final metrics
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
