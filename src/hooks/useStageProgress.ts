import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStageProgress({ studentId }: { studentId: string | undefined }) {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState(1);

  const markStageComplete = useCallback((stageNumber: number) => {
    if (!completedStages.includes(stageNumber)) {
      setCompletedStages(prev => [...prev, stageNumber]);
    }
    if (stageNumber < 6 && currentStage === stageNumber) {
      setCurrentStage(stageNumber + 1);
    }
  }, [completedStages, currentStage]);

  const goToStage = useCallback((stageNumber: number) => {
    if (stageNumber === 1 || completedStages.includes(stageNumber - 1)) {
      setCurrentStage(stageNumber);
    }
  }, [completedStages]);

  const isStageUnlocked = useCallback((stageNumber: number) => {
    if (stageNumber === 1) return true;
    return completedStages.includes(stageNumber - 1);
  }, [completedStages]);

  return {
    completedStages,
    setCompletedStages,
    currentStage,
    setCurrentStage,
    markStageComplete,
    goToStage,
    isStageUnlocked,
  };
}
