import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseStageProgressOptions {
  enrollmentId: string | undefined;
  moduleId: string | undefined;
  totalStages?: number;
}

export function useStageProgress({ enrollmentId, moduleId, totalStages = 6 }: UseStageProgressOptions) {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [resourceViewStates, setResourceViewStates] = useState<Record<string, boolean>>({});
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
          .select("completed_stages, current_stage, resource_view_states")
          .eq("enrollment_id", enrollmentId)
          .eq("module_id", moduleId)
          .maybeSingle();

        if (error) {
          console.error("Error loading stage progress:", error);
        } else if (data) {
          setCompletedStages(data.completed_stages || []);
          setCurrentStage(data.current_stage || 1);
          setResourceViewStates((data.resource_view_states as Record<string, boolean>) || {});
        } else {
          // No progress record yet, start fresh
          setCompletedStages([]);
          setCurrentStage(1);
          setResourceViewStates({});
        }
      } catch (err) {
        console.error("Error loading stage progress:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [enrollmentId, moduleId]);

  // Update enrollment progress and last_accessed_at
  const updateEnrollmentProgress = useCallback(
    async (completedStagesCount: number) => {
      if (!enrollmentId) return;

      const progress = Math.round((completedStagesCount / totalStages) * 100);
      try {
        await supabase
          .from("enrollments")
          .update({
            progress: Math.min(progress, 100),
            last_accessed_at: new Date().toISOString(),
          })
          .eq("id", enrollmentId);
      } catch (err) {
        console.error("Error updating enrollment progress:", err);
      }
    },
    [enrollmentId, totalStages]
  );

  // Persist progress to database
  const persistProgress = useCallback(
    async (newCompletedStages: number[], newCurrentStage: number, newResourceViewStates?: Record<string, boolean>) => {
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
              resource_view_states: newResourceViewStates || resourceViewStates,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "enrollment_id,module_id",
            }
          );

        if (error) {
          console.error("Error saving stage progress:", error);
        }

        // Also update the parent enrollment progress
        await updateEnrollmentProgress(newCompletedStages.length);
      } catch (err) {
        console.error("Error persisting stage progress:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [enrollmentId, moduleId, resourceViewStates, updateEnrollmentProgress]
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

  // Mark a specific resource as viewed (persisted)
  const markResourceViewed = useCallback(
    async (resourceId: string) => {
      const newStates = { ...resourceViewStates, [resourceId]: true };
      setResourceViewStates(newStates);
      
      // Persist to database
      await persistProgress(completedStages, currentStage, newStates);
    },
    [resourceViewStates, completedStages, currentStage, persistProgress]
  );

  // Check if a resource has been viewed
  const isResourceViewed = useCallback(
    (resourceId: string) => {
      return resourceViewStates[resourceId] === true;
    },
    [resourceViewStates]
  );

  // Reset progress for a new module
  const resetForModule = useCallback((newModuleId: string) => {
    setCompletedStages([]);
    setCurrentStage(1);
    setResourceViewStates({});
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
    // Resource view tracking
    resourceViewStates,
    markResourceViewed,
    isResourceViewed,
  };
}
