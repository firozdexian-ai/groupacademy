import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

/**
 * GroUp Academy: Democratic Engagement Sentinel
 * CTO Reference: Authoritative controller for community sentiment and poll synchronization.
 * Logic: Implements optimistic voting handshakes and distribution telemetry.
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
  castVote: (optionId: string) => Promise<void>;
  isLoading: boolean;
}

export function usePollVoting(postId: string, options: { id: string; text: string }[]): UsePollVotingResult {
  const { talent } = useTalent();
  const { toast } = useToast();

  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // PHASE: Registry_Ingress_Audit
  useEffect(() => {
    const fetchInstitutionalVotes = async () => {
      const { data: votes, error } = await supabase
        .from("poll_votes")
        .select("option_id, talent_id")
        .eq("post_id", postId);

      if (error) {
        console.error("POLL_SYNC_FAULT:", error);
        return;
      }

      const counts: Record<string, number> = {};
      options.forEach((opt) => {
        counts[opt.id] = 0;
      });

      if (votes) {
        votes.forEach((vote) => {
          if (counts[vote.option_id] !== undefined) {
            counts[vote.option_id]++;
          }
          // HUD: Identity Handshake
          if (talent?.id && vote.talent_id === talent.id) {
            setHasVoted(true);
            setUserVote(vote.option_id);
          }
        });
        setVoteCounts(counts);
      }
    };

    fetchInstitutionalVotes();
  }, [postId, talent?.id, options]);

  // PHASE: Telemetry_Derivation
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  const results: PollResult[] = options.map((opt) => {
    const votes = voteCounts[opt.id] || 0;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return { optionId: opt.id, votes, percentage };
  });

  // PHASE: Artifact_Synchronization
  const castVote = useCallback(
    async (optionId: string) => {
      if (!talent?.id) {
        toast({ title: "INGRESS_REQUIRED", description: "Sign in to authorize your vote.", variant: "destructive" });
        return;
      }

      if (hasVoted) {
        toast({ title: "IDEMPOTENCY_RESTRICTION", description: "Your vote artifact is already recorded." });
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await supabase.from("poll_votes").insert({
          post_id: postId,
          talent_id: talent.id,
          option_id: optionId,
        });

        if (error) throw error;

        // HUD: OPTIMISTIC_UI_SYNC
        setVoteCounts((prev) => ({
          ...prev,
          [optionId]: (prev[optionId] || 0) + 1,
        }));
        setHasVoted(true);
        setUserVote(optionId);

        toast({ title: "VOTE_SYNCHRONIZED", description: "Artifact successfully committed to ledger." });
      } catch (err) {
        console.error("VOTING_COMMIT_FAULT:", err);
        toast({ title: "REGISTRY_ERROR", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [postId, talent?.id, hasVoted, toast],
  );

  return { hasVoted, userVote, results, totalVotes, castVote, isLoading };
}
