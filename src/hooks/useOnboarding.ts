import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { useQueryClient } from "@tanstack/react-query";

/**
 * GroUp Academy: Talent Lifecycle Orchestrator
 * CTO Reference: Authoritative gatekeeper for talent ingress and trajectory initialization.
 * Logic: Implements idempotent welcome bonuses and neural cache purging.
 */

export interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const { talent, refreshTalent } = useTalent();
  const { addCredits } = useCredits();
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const isOnboardingComplete = !!talent?.onboardingCompletedAt;
  const currentStep = talent?.onboardingStep || 0;

  // PHASE: Monotonic_Step_Update
  const updateStep = useCallback(
    async (step: number) => {
      if (!talent?.id) return false;

      setIsUpdating(true);
      try {
        const { error } = await supabase.from("talents").update({ onboarding_step: step }).eq("id", talent.id);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("[Sentinel] ONBOARDING_STEP_FAULT:", err);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [talent?.id],
  );

  // PHASE: Trajectory_Initialization
  const completeOnboarding = useCallback(async () => {
    if (!talent?.id) return false;

    setIsUpdating(true);
    try {
      // HUD: IDEMPOTENCY_CHECK
      const { data: existingCredits } = await supabase
        .from("talent_credits")
        .select("id")
        .eq("talent_id", talent.id)
        .maybeSingle();

      // EXECUTE: Fiscal Welcome Handshake (250 Units)
      if (!existingCredits) {
        await addCredits(250, "welcome_bonus", "Institutional welcome bonus - Trajectory Start");
      }

      // HUD: REGISTRY_STATUS_SYNC
      const { error: syncError } = await supabase
        .from("talents")
        .update({
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 2, // Terminal Step Node
        })
        .eq("id", talent.id);

      if (syncError) throw syncError;

      // HUD: NEURAL_CACHE_PURGE
      // Remove stale recommendations to allow fresh trajectory scoring
      await supabase.from("ai_recommendations").delete().eq("talent_id", talent.id);

      // Invalidate global content caches
      queryClient.invalidateQueries({ queryKey: ["feed-recommendations"] });

      await refreshTalent();
      return true;
    } catch (err) {
      console.error("[Sentinel] ONBOARDING_COMPLETION_FAULT:", err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [talent?.id, refreshTalent, addCredits, queryClient]);

  return {
    currentStep,
    isOnboardingComplete,
    isUpdating,
    updateStep,
    completeOnboarding,
    skipOnboarding: useCallback(() => completeOnboarding(), [completeOnboarding]),
  };
}
