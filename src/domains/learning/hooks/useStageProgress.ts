import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStageProgress,
  upsertEnrollmentStageProgress,
  updateEnrollmentProgress,
} from "@/domains/learning/repo/learningRepo";

/**
 * GroUp Academy: Monotonic Progress Guard (V5.6.0)
 * CTO Reference: Authoritative transactional interface managing stage gates and linear progression.
 * Architecture: Optimized via TanStack Data Node bundling with atomic mutation cascades.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface UseStageProgressOptions {
  enrollmentId: string | undefined;
  moduleId: string | undefined;
  totalStages?: number;
}

interface StageProgressPayload {
  completedStages: number[];
  currentStage: number;
  resourceViewStates: Record<string, boolean>;
}

/**
 * Orchestrates linear workflow locks, resource views, and aggregated progress scores.
 */
export function useStageProgress({ enrollmentId, moduleId, totalStages = 6 }: UseStageProgressOptions) {
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["stage-progress", enrollmentId, moduleId], [enrollmentId, moduleId]);

  // --- SENSOR: PROGRESS_REGISTRY_QUERY ---
  const {
    data: progressData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!enrollmentId && !!moduleId,
    staleTime: 15000, // 15-second consistency boundary
    queryFn: async (): Promise<StageProgressPayload> => {
      // HUD: EXECUTING_STAGE_PROGRESS_INGRESS
      const data = await getStageProgress(enrollmentId!, moduleId!);

      if (!data) {
        return { completedStages: [], currentStage: 1, resourceViewStates: {} };
      }

      return {
        completedStages: data.completed_stages || [],
        currentStage: data.current_stage || 1,
        resourceViewStates: (data.resource_view_states as Record<string, boolean>) || {},
      };
    },
  });

  const activeProgress = useMemo(
    () => progressData || { completedStages: [], currentStage: 1, resourceViewStates: {} },
    [progressData],
  );

  // --- ACTION: PROGRESSION_PERSISTENCE_MUTATION ---
  const persistMutation = useMutation({
    mutationFn: async (payload: StageProgressPayload) => {
      if (!enrollmentId || !moduleId) return;

      // HUD: EXECUTING_PROGRESS_UPSERT_HANDSHAKE
      await upsertEnrollmentStageProgress({
        enrollment_id: enrollmentId,
        module_id: moduleId,
        completed_stages: payload.completedStages,
        current_stage: payload.currentStage,
        resource_view_states: payload.resourceViewStates,
      });

      // HUD: EXECUTING_ENROLLMENT_AGGREGATE_CALCULATION
      const progressPercent = Math.round((payload.completedStages.length / totalStages) * 100);
      await updateEnrollmentProgress(enrollmentId, {
        progress: Math.min(progressPercent, 100),
        last_accessed_at: new Date().toISOString(),
      });
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<StageProgressPayload>(queryKey);

      // HUD: APPLYING_OPTIMISTIC_PROGRESS_METRICS
      qc.setQueryData<StageProgressPayload>(queryKey, payload);

      return { previous };
    },
    onError: (err: any, _, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }
      // Digital Workforce Anomaly Trigger: Dispatches trace packets straight to monitoring dashboards
      console.error("[Digital Workforce] ANOMALY: Progress persistence operation rejected.", {
        enrollmentId,
        moduleId,
        message: err.message,
      });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ["enrollment-progression"] }); // Invalidate global aggregate tracking metrics
    },
  });

  // --- PHASE: MUTATION_PROXY_INTERFACES ---

  const setCurrentStage = useCallback(
    (targetStage: number) => {
      persistMutation.mutate({
        ...activeProgress,
        currentStage: targetStage,
      });
    },
    [activeProgress, persistMutation],
  );

  const resetForModule = useCallback(
    (newModuleId: string) => {
      // Structural flush to start fresh protocols cleanly
      qc.setQueryData(queryKey, { completedStages: [], currentStage: 1, resourceViewStates: {} });
    },
    [qc, queryKey],
  );

  const markStageComplete = useCallback(
    async (stageNumber: number) => {
      const currentCompleted = activeProgress.completedStages;
      const nextCompleted = currentCompleted.includes(stageNumber)
        ? currentCompleted
        : [...currentCompleted, stageNumber];
      const nextStage =
        stageNumber < 6 && activeProgress.currentStage === stageNumber ? stageNumber + 1 : activeProgress.currentStage;

      await persistMutation.mutateAsync({
        completedStages: nextCompleted,
        currentStage: nextStage,
        resourceViewStates: activeProgress.resourceViewStates,
      });
    },
    [activeProgress, persistMutation],
  );

  const goToStage = useCallback(
    (stage: number) => {
      if (stage === 1 || activeProgress.completedStages.includes(stage - 1)) {
        persistMutation.mutate({
          ...activeProgress,
          currentStage: stage,
        });
      }
    },
    [activeProgress, persistMutation],
  );

  const markResourceViewed = useCallback(
    async (resId: string) => {
      if (activeProgress.resourceViewStates[resId]) return;

      const nextViewStates = { ...activeProgress.resourceViewStates, [resId]: true };

      await persistMutation.mutateAsync({
        ...activeProgress,
        resourceViewStates: nextViewStates,
      });
    },
    [activeProgress, persistMutation],
  );

  return {
    completedStages: activeProgress.completedStages,
    currentStage: activeProgress.currentStage,
    setCurrentStage,
    markStageComplete,
    goToStage,
    isStageUnlocked: (stage: number) => stage === 1 || activeProgress.completedStages.includes(stage - 1),
    isLoading,
    isSaving: persistMutation.isPending,
    resetForModule,
    resourceViewStates: activeProgress.resourceViewStates,
    markResourceViewed,
    isResourceViewed: (resId: string) => activeProgress.resourceViewStates[resId] === true,
  };
}
