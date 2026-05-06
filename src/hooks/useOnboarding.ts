import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Onboarding wizard state — tracks current step, awards welcome credits once,
 * and resets recommendation cache on completion.
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

  
  const updateStep = useCallback(
    async (step: number) => {
      if (!talent?.id) return false;

      setIsUpdating(true);
      try {
        const { error } = await supabase.from("talents").update({ onboarding_step: step }).eq("id", talent.id);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Onboarding step update failed:", err);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [talent?.id],
  );

  
  const completeOnboarding = useCallback(async () => {
    if (!talent?.id) return false;

    setIsUpdating(true);
    try {
      
      const { data: existingCredits } = await supabase
        .from("talent_credits")
        .select("id")
        .eq("talent_id", talent.id)
        .maybeSingle();

      // Award welcome credits (idempotent — only if no row exists yet)
      if (!existingCredits) {
        await addCredits(250, "welcome_bonus", "Welcome bonus");
      }

      
      const { error: syncError } = await supabase
        .from("talents")
        .update({
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 2,
        })
        .eq("id", talent.id);

      if (syncError) throw syncError;

      
      // Clear stale recommendations so they re-rank with the new profile
      await supabase.from("ai_recommendations").delete().eq("talent_id", talent.id);

      // Invalidate global content caches
      queryClient.invalidateQueries({ queryKey: ["feed-recommendations"] });

      await refreshTalent();
      return true;
    } catch (err) {
      console.error("Onboarding completion failed:", err);
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
