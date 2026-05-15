import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

/**
 * GroUp Academy: Universal Monetized Hype Orchestrator
 * CTO Reference: Primary financial transaction sensor for platform micro-reactions.
 * Architecture: Digital Workforce enabled - anomaly monitoring on ledger faults.
 * Phase: Z0 Code Freeze Hardened.
 */

export type HypeContentType = "post" | "course" | "video" | "blog";

interface HypeMutationContext {
  previousCount: number;
}

export function useContentHype(contentType: HypeContentType, contentId: string, initialCount: number = 0) {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [count, setCount] = useState<number>(initialCount);

  // Synchronize state value cleanly when updated from upstream query invalidations
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  /**
   * PHASE: Execution_Handshake
   * Declarative mutation model that enforces strict pre-flight state validation.
   * Leverages deterministic rollbacks on transaction faults.
   */
  const hypeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!talent?.id) {
        throw new Error("UNAUTHORIZED_IDENTITY_NODE: Hydrated account required.");
      }

      // HUD: ATOMIC_LEDGER_TRANSFER
      const { error } = await supabase.rpc("hype_content" as any, {
        _content_type: contentType,
        _content_id: contentId,
      });

      if (error) {
        throw error;
      }
    },
    onMutate: async (): Promise<HypeMutationContext> => {
      // Cancel outgoing queries to prevent stale data frames from overwriting optimistic UI state
      const queryKey = ["content-hype", contentType, contentId];
      await queryClient.cancelQueries({ queryKey });

      const previousCount = count;

      // Optimistic UI updates - Enforce 'Automated Efficiency' for quick interactive feedback
      setCount((c) => c + 1);

      return { previousCount };
    },
    onError: (err: any, _, context) => {
      // Rollback optimistic counter to previous known state immediately upon network/DB dropout
      if (context) {
        setCount(context.previousCount);
      }

      const msg = err.message || "";

      // HUD: CORE_FISCAL_RECONCILIATION_ROUTING
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        toast({
          title: "Not enough credits",
          description: "Top up your wallet to continue hyping creator content.",
          variant: "destructive",
        });
      } else if (msg.includes("CANNOT_HYPE_SELF")) {
        toast({
          title: "You can't hype yourself",
          variant: "destructive",
        });
      } else if (msg.includes("ALREADY_HYPED")) {
        toast({
          title: "Already hyped",
          description: "You have already contributed to this content trajectory.",
        });
      } else {
        // Digital Workforce System Flag: Route uncaught transactional glitches to the Admin Console
        console.error("[Digital Workforce] ANOMALY: hype_content ledger transition failure.", {
          talentId: talent?.id,
          contentType,
          contentId,
          message: msg,
          code: err.code,
        });

        toast({
          title: "Hype failed",
          description: "Transaction processing error. Log enqueued for system audit.",
          variant: "destructive",
        });
      }
    },
    onSuccess: () => {
      toast({ title: "🔥 Hype sent · -1 credit" });

      // Trigger cache invalidation map to notify structural counters globally
      queryClient.invalidateQueries({ queryKey: ["content-hype", contentType, contentId] });
      queryClient.invalidateQueries({ queryKey: ["talent-lifetime-credits", talent?.id] });
    },
  });

  return {
    count,
    hype: hypeMutation.mutateAsync,
    isHyping: hypeMutation.isPending,
  };
}
