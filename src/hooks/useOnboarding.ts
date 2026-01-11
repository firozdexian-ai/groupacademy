import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { useCredits } from '@/hooks/useCredits';
import { useQueryClient } from '@tanstack/react-query';

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

  const updateStep = useCallback(async (step: number) => {
    if (!talent?.id) return false;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('talents')
        .update({ onboarding_step: step })
        .eq('id', talent.id);

      if (error) {
        console.error('[useOnboarding] Error updating step:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[useOnboarding] Error updating step:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [talent?.id]);

  const completeOnboarding = useCallback(async () => {
    if (!talent?.id) return false;
    
    setIsUpdating(true);
    try {
      // Check if user already has credits (prevent double bonus)
      const { data: existingCredits } = await supabase
        .from('talent_credits')
        .select('id')
        .eq('talent_id', talent.id)
        .maybeSingle();

      // Give welcome bonus only if no existing credits
      if (!existingCredits) {
        const creditsGiven = await addCredits(250, 'welcome_bonus', 'Welcome bonus for new users');
        if (!creditsGiven) {
          console.error('[useOnboarding] Failed to add welcome bonus');
          // Continue anyway - don't block onboarding completion
        } else {
          console.log('[useOnboarding] Welcome bonus of 250 credits given');
        }
      } else {
        console.log('[useOnboarding] User already has credits, skipping welcome bonus');
      }

      // Mark onboarding complete
      const { error } = await supabase
        .from('talents')
        .update({ 
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 2 // Final step for 3-step onboarding (0-indexed)
        })
        .eq('id', talent.id);

      if (error) {
        console.error('[useOnboarding] Error completing onboarding:', error);
        return false;
      }

      // Invalidate cached AI recommendations to force fresh scoring
      if (talent.id) {
        await supabase
          .from('ai_recommendations')
          .delete()
          .eq('talent_id', talent.id);
        console.log('[useOnboarding] Cleared cached AI recommendations');
      }

      // Also invalidate any React Query caches
      queryClient.invalidateQueries({ queryKey: ['feed-recommendations'] });

      await refreshTalent();
      return true;
    } catch (error) {
      console.error('[useOnboarding] Error completing onboarding:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [talent?.id, refreshTalent, addCredits, queryClient]);

  const skipOnboarding = useCallback(async () => {
    return completeOnboarding();
  }, [completeOnboarding]);

  return {
    currentStep,
    isOnboardingComplete,
    isUpdating,
    updateStep,
    completeOnboarding,
    skipOnboarding,
  };
}
