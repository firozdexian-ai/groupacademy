import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseStageProgressOptions {
  enrollmentId: string | undefined;
  moduleId: string | undefined;
}

export function useStageProgress({ enrollmentId, moduleId }: UseStageProgressOptions) {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load persisted progress from database
  useEffect(() => {
    async function loadProgress() {
      if (!enrollmentId || !moduleId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("enrollment_stage_progress")
          .select("completed_stages, current_stage")
          .eq("enrollment_id", enrollmentId)
          .eq("module_id", moduleId)
          .maybeSingle();

        if (error) {
          console.error("Error loading stage progress:", error);
        } else if (data) {
          setCompletedStages(data.completed_stages || []);
          setCurrentStage(data.current_stage || 1);
        } else {
          // No progress record yet, start fresh
          setCompletedStages([]);
          setCurrentStage(1);
        }
      } catch (err) {
        console.error("Error loading stage progress:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [enrollmentId, moduleId]);

  // Persist progress to database
  const persistProgress = useCallback(
    async (newCompletedStages: number[], newCurrentStage: number) => {
      if (!enrollmentId || !moduleId) return;

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("enrollment_stage_progress")
          .upsert(
            {
              enrollment_id: enrollmentId,
              module_id: moduleId,
              completed_stages: newCompletedStages,
              current_stage: newCurrentStage,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "enrollment_id,module_id",
            }
          );

        if (error) {
          console.error("Error saving stage progress:", error);
        }
      } catch (err) {
        console.error("Error persisting stage progress:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [enrollmentId, moduleId]
  );

  const markStageComplete = useCallback(
    async (stageNumber: number) => {
      const newCompletedStages = completedStages.includes(stageNumber)
        ? completedStages
        : [...completedStages, stageNumber];

      const newCurrentStage = stageNumber < 6 && currentStage === stageNumber 
        ? stageNumber + 1 
        : currentStage;

      // Update local state immediately for responsiveness
      setCompletedStages(newCompletedStages);
      setCurrentStage(newCurrentStage);

      // Persist to database
      await persistProgress(newCompletedStages, newCurrentStage);
    },
    [completedStages, currentStage, persistProgress]
  );

  const goToStage = useCallback(
    (stageNumber: number) => {
      // Allow navigation to stage 1 or any stage where previous is completed
      if (stageNumber === 1 || completedStages.includes(stageNumber - 1)) {
        setCurrentStage(stageNumber);
        // Persist the navigation
        persistProgress(completedStages, stageNumber);
      }
    },
    [completedStages, persistProgress]
  );

  const isStageUnlocked = useCallback(
    (stageNumber: number) => {
      if (stageNumber === 1) return true;
      return completedStages.includes(stageNumber - 1);
    },
    [completedStages]
  );

  // Reset progress for a new module
  const resetForModule = useCallback((newModuleId: string) => {
    setCompletedStages([]);
    setCurrentStage(1);
    setIsLoading(true);
  }, []);

  return {
    completedStages,
    setCompletedStages,
    currentStage,
    setCurrentStage,
    markStageComplete,
    goToStage,
    isStageUnlocked,
    isLoading,
    isSaving,
    resetForModule,
  };
}
