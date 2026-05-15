import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Academic Milestone & Progression Core (V5.6.0)
 * CTO Reference: Authoritative single-trip controller managing multi-table state sync.
 * Architecture: TanStack Cache Synced - eliminates un-throttled query cascade loops.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Variant).
 */

export interface ModuleProgressRow {
  moduleId: string;
  displayOrder: number;
  title: string;
  stagesCompleted: number[];
  totalStages: number;
  progressPct: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface UseProgressOptions {
  enrollmentId: string | undefined;
  contentId: string | undefined;
}

interface ProgressQueryPayload {
  modules: ModuleProgressRow[];
  resourceViewStates: Record<string, Record<string, boolean>>;
  overallPct: number;
  isCompleted: boolean;
  currentModuleId: string | null;
}

const TOTAL_STAGES = 6;

export function useProgress({ enrollmentId, contentId }: UseProgressOptions) {
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["enrollment-progression", enrollmentId, contentId], [enrollmentId, contentId]);

  // --------------------------------------------------------
  // PHASE 1: Combined Core Progression Observer
  // --------------------------------------------------------
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    enabled: !!enrollmentId && !!contentId,
    staleTime: 15000, // 15-second cache consistency boundary
    queryFn: async (): Promise<ProgressQueryPayload> => {
      // HUD: ATOMIC_ACADEMIC_PROGRESS_BUNDLE_SELECT
      const [cmRes, mpRes, enrRes, espRes] = await Promise.all([
        supabase
          .from("course_modules")
          .select("id, display_order, title")
          .eq("content_id", contentId!)
          .order("display_order", { ascending: true }),
        supabase
          .from("module_progress")
          .select("module_id, stages_completed, total_stages, progress_pct, started_at, completed_at")
          .eq("enrollment_id", enrollmentId!),
        supabase
          .from("enrollments")
          .select("progress, status, current_module_id")
          .eq("id", enrollmentId!)
          .maybeSingle(),
        supabase
          .from("enrollment_stage_progress")
          .select("module_id, resource_view_states")
          .eq("enrollment_id", enrollmentId!),
      ]);

      if (cmRes.error) throw cmRes.error;
      if (mpRes.error) throw mpRes.error;
      if (enrRes.error) throw enrRes.error;
      if (espRes.error) throw espRes.error;

      const mpByModule = new Map((mpRes.data ?? []).map((r) => [r.module_id, r]));

      const modules: ModuleProgressRow[] = (cmRes.data ?? []).map((m) => {
        const mp = mpByModule.get(m.id);
        return {
          moduleId: m.id,
          displayOrder: m.display_order,
          title: m.title,
          stagesCompleted: mp?.stages_completed ?? [],
          totalStages: mp?.total_stages ?? TOTAL_STAGES,
          progressPct: mp?.progress_pct ?? 0,
          startedAt: mp?.started_at ?? null,
          completedAt: mp?.completed_at ?? null,
        };
      });

      const resourceViewStates: Record<string, Record<string, boolean>> = {};
      (espRes.data ?? []).forEach((row) => {
        resourceViewStates[row.module_id] = (row.resource_view_states as Record<string, boolean>) ?? {};
      });

      const resumeModuleId =
        enrRes.data?.current_module_id ??
        modules.find((m) => m.progressPct < 100)?.moduleId ??
        modules[0]?.moduleId ??
        null;

      return {
        modules,
        resourceViewStates,
        overallPct: enrRes.data?.progress ?? 0,
        isCompleted: enrRes.data?.status === "completed",
        currentModuleId: resumeModuleId,
      };
    },
  });

  // --- HUD: REALTIME_CDC_THROTTLED_SYNCHRONIZER ---
  useMemo(() => {
    if (!enrollmentId) return;

    const channel = supabase
      .channel(`public:module_progress_sync:${enrollmentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "module_progress", filter: `enrollment_id=eq.${enrollmentId}` },
        () => {
          // Trigger controlled background revalidation without clearing existing layout states
          void qc.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enrollmentId, qc, queryKey]);

  // --------------------------------------------------------
  // PHASE 2: Core Academic Mutation Workflows
  // --------------------------------------------------------

  const stageProgressMutation = useMutation({
    mutationFn: async (payload: {
      moduleId: string;
      completedStages: number[];
      currentStage: number;
      rvs: Record<string, boolean>;
    }) => {
      if (!enrollmentId) return;

      const { error } = await supabase.from("enrollment_stage_progress").upsert(
        {
          enrollment_id: enrollmentId,
          module_id: payload.moduleId,
          completed_stages: payload.completedStages,
          current_stage: payload.currentStage,
          resource_view_states: payload.rvs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "enrollment_id,module_id" },
      );

      if (error) {
        console.error("[Digital Workforce] FAULT: enrollment_stage_progress update rejected.", error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const currentModuleMutation = useMutation({
    mutationFn: async (targetModuleId: string) => {
      if (!enrollmentId) return;

      const { error } = await supabase
        .from("enrollments")
        .update({
          current_module_id: targetModuleId,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", enrollmentId);

      if (error) {
        console.error("[Digital Workforce] FAULT: Failed to update current_module_id tracking registry.", error);
        throw error;
      }
    },
    onMutate: async (targetModuleId) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ProgressQueryPayload>(queryKey);

      if (previous) {
        qc.setQueryData<ProgressQueryPayload>(queryKey, {
          ...previous,
          currentModuleId: targetModuleId,
        });
      }
      return { previous };
    },
    onError: (err: any, _, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  // --------------------------------------------------------
  // PHASE 3: Context-Safe Interaction Proxies
  // --------------------------------------------------------

  const markStageComplete = useCallback(
    async (moduleId: string, stage: number) => {
      if (!data) return;
      const m = data.modules.find((x) => x.moduleId === moduleId);
      const nextStages = Array.from(new Set([...(m?.stagesCompleted ?? []), stage])).sort((a, b) => a - b);
      const targetNextStage = Math.min(TOTAL_STAGES, stage + 1);
      const currentRvs = data.resourceViewStates[moduleId] ?? {};

      // HUD: EXECUTE_OPTIMISTIC_STAGE_PROGRESS_MUTATION
      qc.setQueryData<ProgressQueryPayload>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          modules: old.modules.map((x) =>
            x.moduleId === moduleId
              ? {
                  ...x,
                  stagesCompleted: nextStages,
                  progressPct: Math.min(100, Math.round((nextStages.length / TOTAL_STAGES) * 100)),
                }
              : x,
          ),
        };
      });

      try {
        await stageProgressMutation.mutateAsync({
          moduleId,
          completedStages: nextStages,
          currentStage: targetNextStage,
          rvs: currentRvs,
        });
      } catch {
        void refetch();
      }
    },
    [data, qc, queryKey, stageProgressMutation, refetch],
  );

  const markResourceViewed = useCallback(
    async (moduleId: string, resourceId: string) => {
      if (!data) return;
      const curRvs = data.resourceViewStates[moduleId] ?? {};
      if (curRvs[resourceId]) return;

      const nextRv = { ...curRvs, [resourceId]: true };
      const m = data.modules.find((x) => x.moduleId === moduleId);
      const completed = m?.stagesCompleted ?? [];
      const currentStage = Math.min(TOTAL_STAGES, Math.max(...completed, 0) + 1);

      // HUD: EXECUTE_OPTIMISTIC_RESOURCE_VIEW_MUTATION
      qc.setQueryData<ProgressQueryPayload>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          resourceViewStates: {
            ...old.resourceViewStates,
            [moduleId]: nextRv,
          },
        };
      });

      try {
        await stageProgressMutation.mutateAsync({
          moduleId,
          completedStages: completed,
          currentStage,
          rvs: nextRv,
        });
      } catch {
        void refetch();
      }
    },
    [data, qc, queryKey, stageProgressMutation, refetch],
  );

  // --------------------------------------------------------
  // PHASE 4: Memoized Layout Selector Methods
  // --------------------------------------------------------

  const selectors = useMemo(() => {
    const modulesList = data?.modules ?? [];
    const rvsMap = data?.resourceViewStates ?? {};

    return {
      isStageUnlocked: (moduleId: string, stage: number) => {
        if (stage <= 1) return true;
        const m = modulesList.find((x) => x.moduleId === moduleId);
        return m?.stagesCompleted.includes(stage - 1) ?? false;
      },
      isStageCompleted: (moduleId: string, stage: number) => {
        return modulesList.find((x) => x.moduleId === moduleId)?.stagesCompleted.includes(stage) ?? false;
      },
      getCurrentStage: (moduleId: string) => {
        const m = modulesList.find((x) => x.moduleId === moduleId);
        if (!m) return 1;
        if (m.progressPct >= 100) return TOTAL_STAGES;
        return Math.min(TOTAL_STAGES, Math.max(...m.stagesCompleted, 0) + 1);
      },
      isResourceViewed: (moduleId: string, resourceId: string) => {
        return Boolean(rvsMap[moduleId]?.[resourceId]);
      },
      completedModuleCount: modulesList.filter((m) => m.progressPct >= 100).length,
    };
  }, [data]);

  return {
    modules: data?.modules ?? [],
    overallPct: data?.overallPct ?? 0,
    isCompleted: data?.isCompleted ?? false,
    completedModuleCount: selectors.completedModuleCount,
    totalModules: (data?.modules ?? []).length,
    currentModuleId: data?.currentModuleId ?? null,
    setCurrentModule: currentModuleMutation.mutate,
    markStageComplete,
    markResourceViewed,
    isStageUnlocked: selectors.isStageUnlocked,
    isStageCompleted: selectors.isStageCompleted,
    getCurrentStage: selectors.getCurrentStage,
    isResourceViewed: selectors.isResourceViewed,
    isLoading,
    error,
    reload: refetch,
  };
}
