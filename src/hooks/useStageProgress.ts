import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Monotonic Progress Guard
 * CTO Reference: Authoritative controller for curriculum stage transitions.
 * Fix Log: v2.4.32 - Exposed setCurrentStage and resetForModule for ImmersivePlayer sync.
 */

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

  // --- PHASE: Registry_Ingress ---
  const loadProgress = useCallback(async () => {
    if (!enrollmentId || !moduleId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("enrollment_stage_progress")
        .select("completed_stages, current_stage, resource_view_states")
        .eq("enrollment_id", enrollmentId)
        .eq("module_id", moduleId)
        .maybeSingle();

      if (error) {
        console.error("REGISTRY_FETCH_FAULT:", error);
      } else if (data) {
        setCompletedStages(data.completed_stages || []);
        setCurrentStage(data.current_stage || 1);
        setResourceViewStates((data.resource_view_states as Record<string, boolean>) || {});
      } else {
        // Start Fresh Protocol
        setCompletedStages([]);
        setCurrentStage(1);
        setResourceViewStates({});
      }
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId, moduleId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // --- PHASE: Persistence_Handshake ---
  const persistProgress = useCallback(
    async (newCompletedStages: number[], newCurrentStage: number, newResourceViewStates?: Record<string, boolean>) => {
      if (!enrollmentId || !moduleId) return;

      setIsSaving(true);
      try {
        const { error } = await supabase.from("enrollment_stage_progress").upsert(
          {
            enrollment_id: enrollmentId,
            module_id: moduleId,
            completed_stages: newCompletedStages,
            current_stage: newCurrentStage,
            resource_view_states: newResourceViewStates || resourceViewStates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "enrollment_id,module_id" },
        );

        if (error) throw error;

        // Sync aggregate enrollment percentage
        const progressPercent = Math.round((newCompletedStages.length / totalStages) * 100);
        await supabase
          .from("enrollments")
          .update({
            progress: Math.min(progressPercent, 100),
            last_accessed_at: new Date().toISOString(),
          })
          .eq("id", enrollmentId);
      } catch (err) {
        console.error("PERSISTENCE_FAULT:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [enrollmentId, moduleId, resourceViewStates, totalStages],
  );

  // --- PHASE: Public_Interface_Artifacts ---
  const resetForModule = useCallback((newModuleId: string) => {
    setCompletedStages([]);
    setCurrentStage(1);
    setResourceViewStates({});
    setIsLoading(true);
  }, []);

  const markStageComplete = useCallback(
    async (stageNumber: number) => {
      const newCompleted = completedStages.includes(stageNumber) ? completedStages : [...completedStages, stageNumber];
      const nextStage = stageNumber < 6 && currentStage === stageNumber ? stageNumber + 1 : currentStage;

      setCompletedStages(newCompleted);
      setCurrentStage(nextStage);
      await persistProgress(newCompleted, nextStage);
    },
    [completedStages, currentStage, persistProgress],
  );

  return {
    completedStages,
    currentStage,
    setCurrentStage, // FIXED: Now exposed for direct player control
    markStageComplete,
    goToStage: useCallback(
      (stage: number) => {
        if (stage === 1 || completedStages.includes(stage - 1)) {
          setCurrentStage(stage);
          persistProgress(completedStages, stage);
        }
      },
      [completedStages, persistProgress],
    ),
    isStageUnlocked: useCallback(
      (stage: number) => stage === 1 || completedStages.includes(stage - 1),
      [completedStages],
    ),
    isLoading,
    isSaving,
    resetForModule, // FIXED: Now exposed for module transitions
    resourceViewStates,
    markResourceViewed: useCallback(
      async (resId: string) => {
        const newStates = { ...resourceViewStates, [resId]: true };
        setResourceViewStates(newStates);
        await persistProgress(completedStages, currentStage, newStates);
      },
      [resourceViewStates, completedStages, currentStage, persistProgress],
    ),
    isResourceViewed: (resId: string) => resourceViewStates[resId] === true,
  };
}
