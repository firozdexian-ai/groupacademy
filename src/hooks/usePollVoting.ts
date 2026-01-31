import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { useToast } from '@/hooks/use-toast';

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

  // Fetch votes on mount
  useEffect(() => {
    const fetchVotes = async () => {
      const { data: votes } = await supabase
        .from('poll_votes')
        .select('option_id, talent_id')
        .eq('post_id', postId);

      if (votes) {
        // Count votes per option
        const counts: Record<string, number> = {};
        options.forEach((opt) => {
          counts[opt.id] = 0;
        });

        votes.forEach((vote) => {
          if (counts[vote.option_id] !== undefined) {
            counts[vote.option_id]++;
          }
          // Check if current user voted
          if (talent?.id && vote.talent_id === talent.id) {
            setHasVoted(true);
            setUserVote(vote.option_id);
          }
        });

        setVoteCounts(counts);
      }
    };

    fetchVotes();
  }, [postId, talent?.id, options]);

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  const results: PollResult[] = options.map((opt) => {
    const votes = voteCounts[opt.id] || 0;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return { optionId: opt.id, votes, percentage };
  });

  const castVote = useCallback(
    async (optionId: string) => {
      if (!talent?.id) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to vote on polls',
          variant: 'destructive',
        });
        return;
      }

      if (hasVoted) {
        toast({
          title: 'Already voted',
          description: 'You can only vote once on each poll',
        });
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await supabase.from('poll_votes').insert({
          post_id: postId,
          talent_id: talent.id,
          option_id: optionId,
        });

        if (error) throw error;

        // Update local state
        setVoteCounts((prev) => ({
          ...prev,
          [optionId]: (prev[optionId] || 0) + 1,
        }));
        setHasVoted(true);
        setUserVote(optionId);

        toast({
          title: 'Vote recorded!',
          description: 'Thanks for participating',
        });
      } catch (error) {
        console.error('Error casting vote:', error);
        toast({
          title: 'Error',
          description: 'Failed to record your vote',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [postId, talent?.id, hasVoted, toast]
  );

  return {
    hasVoted,
    userVote,
    results,
    totalVotes,
    castVote,
    isLoading,
  };
}
