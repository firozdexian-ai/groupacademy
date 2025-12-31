import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';

export interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const { talent, refreshTalent } = useTalent();
  const [isUpdating, setIsUpdating] = useState(false);

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
      const { error } = await supabase
        .from('talents')
        .update({ 
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 3 // Final step for 3-step onboarding
        })
        .eq('id', talent.id);

      if (error) {
        console.error('[useOnboarding] Error completing onboarding:', error);
        return false;
      }

      await refreshTalent();
      return true;
    } catch (error) {
      console.error('[useOnboarding] Error completing onboarding:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [talent?.id, refreshTalent]);

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
