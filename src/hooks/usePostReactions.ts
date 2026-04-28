import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

/**
 * GroUp Academy: Sentiment Ingress Controller
 * CTO Reference: Authoritative controller for social engagement and reaction telemetry.
 * Logic: Implements optimistic UI updates and single-reaction enforcement.
 */

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

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

  // PHASE: Registry_Audit
  useEffect(() => {
    const fetchInstitutionalReactions = async () => {
      const { data: artifacts, error } = await supabase
        .from("post_reactions")
        .select("reaction_type, talent_id")
        .eq("post_id", postId);

      if (error) {
        console.error("SENTIMENT_SYNC_FAULT:", error);
        return;
      }

      const counts: Record<ReactionType, number> = {
        like: 0,
        insightful: 0,
        celebrate: 0,
        support: 0,
      };

      if (artifacts) {
        artifacts.forEach((r) => {
          const type = r.reaction_type as ReactionType;
          if (counts[type] !== undefined) counts[type]++;
          // HUD: Identity Handshake
          if (talent?.id && r.talent_id === talent.id) setUserReaction(type);
        });
        setReactions(counts);
      }
    };

    fetchInstitutionalReactions();
  }, [postId, talent?.id]);

  // PHASE: Optimistic_Transaction_Handshake
  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      if (!talent?.id) {
        toast({ title: "INGRESS_REQUIRED", description: "Sign in to authorize reactions.", variant: "destructive" });
        return;
      }

      setIsLoading(true);

      try {
        if (userReaction === type) {
          // ACTION: Remove Sentiment Artifact
          await supabase.from("post_reactions").delete().eq("post_id", postId).eq("talent_id", talent.id);

          setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
          setUserReaction(null);
        } else {
          // ACTION: Switch Sentiment Node
          if (userReaction) {
            await supabase.from("post_reactions").delete().eq("post_id", postId).eq("talent_id", talent.id);
            setReactions((prev) => ({ ...prev, [userReaction]: Math.max(0, prev[userReaction] - 1) }));
          }

          await supabase.from("post_reactions").insert({
            post_id: postId,
            talent_id: talent.id,
            reaction_type: type,
          });

          setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
          setUserReaction(type);
        }
      } catch (err) {
        console.error("SENTIMENT_COMMIT_FAULT:", err);
        toast({ title: "REGISTRY_ERROR", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [postId, talent?.id, userReaction, toast],
  );

  return { reactions, userReaction, toggleReaction, isLoading };
}
