import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { useToast } from '@/hooks/use-toast';

export type ReactionType = 'like' | 'insightful' | 'celebrate' | 'support';

interface UsePostReactionsResult {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  toggleReaction: (type: ReactionType) => Promise<void>;
  isLoading: boolean;
}

export function usePostReactions(postId: string): UsePostReactionsResult {
  const { talent } = useTalent();
  const { toast } = useToast();

  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    like: 0,
    insightful: 0,
    celebrate: 0,
    support: 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reactions on mount
  useEffect(() => {
    const fetchReactions = async () => {
      // Fetch all reactions for this post
      const { data: allReactions } = await supabase
        .from('post_reactions')
        .select('reaction_type, talent_id')
        .eq('post_id', postId);

      if (allReactions) {
        // Count by type
        const counts: Record<ReactionType, number> = {
          like: 0,
          insightful: 0,
          celebrate: 0,
          support: 0,
        };

        allReactions.forEach((r) => {
          const type = r.reaction_type as ReactionType;
          if (counts[type] !== undefined) {
            counts[type]++;
          }
          // Check if current user reacted
          if (talent?.id && r.talent_id === talent.id) {
            setUserReaction(type);
          }
        });

        setReactions(counts);
      }
    };

    fetchReactions();
  }, [postId, talent?.id]);

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      if (!talent?.id) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to react to posts',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      try {
        if (userReaction === type) {
          // Remove reaction
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('talent_id', talent.id);

          setReactions((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] - 1),
          }));
          setUserReaction(null);
        } else {
          // If there's an existing reaction, remove it first
          if (userReaction) {
            await supabase
              .from('post_reactions')
              .delete()
              .eq('post_id', postId)
              .eq('talent_id', talent.id);

            setReactions((prev) => ({
              ...prev,
              [userReaction]: Math.max(0, prev[userReaction] - 1),
            }));
          }

          // Add new reaction
          await supabase.from('post_reactions').insert({
            post_id: postId,
            talent_id: talent.id,
            reaction_type: type,
          });

          setReactions((prev) => ({
            ...prev,
            [type]: prev[type] + 1,
          }));
          setUserReaction(type);
        }
      } catch (error) {
        console.error('Error toggling reaction:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your reaction',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [postId, talent?.id, userReaction, toast]
  );

  return {
    reactions,
    userReaction,
    toggleReaction,
    isLoading,
  };
}
