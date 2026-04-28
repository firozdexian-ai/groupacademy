import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * GroUp Academy: Pedagogical Progress Orchestrator
 * CTO Reference: Authoritative engine for trajectory tracking and stage unlocking.
 * Performance: Optimized relational mapping with optimistic UI synchronization.
 */

interface ModuleProgress {
  moduleId: string;
  completedStages: number[];
  currentStage: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface CourseProgress {
  enrollmentId: string;
  contentId: string;
  modules: ModuleProgress[];
  overallProgress: number;
  isCompleted: boolean;
}

interface UseCourseProgressOptions {
  enrollmentId: string | undefined;
  contentId: string | undefined;
  talentId: string | undefined;
}

export function useCourseProgress({ enrollmentId, contentId, talentId }: UseCourseProgressOptions) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // PHASE: Registry_Ingress
  const loadProgress = useCallback(async () => {
    if (!enrollmentId || !contentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // HUD: Fetch_Module_Architecture
      const { data: modules, error: modulesError } = await supabase
        .from("course_modules")
        .select("id, display_order, title")
        .eq("content_id", contentId)
        .order("display_order", { ascending: true });

      if (modulesError) throw modulesError;

      // HUD: Fetch_Interaction_Telemetry
      const { data: resourceProgress, error: progressError } = await supabase
        .from("student_resource_progress")
        .select("resource_id, completed_at, module_resources!inner(module_id, stage_number)")
        .eq("student_id", talentId || "");

      if (progressError && progressError.code !== "PGRST116") throw progressError;

      const moduleProgressMap = new Map<string, { completedStages: Set<number>; startedAt: string | null }>();

      (resourceProgress || []).forEach((rp: any) => {
        const moduleId = rp.module_resources?.module_id;
        const stageNumber = rp.module_resources?.stage_number;

        if (moduleId && stageNumber) {
          if (!moduleProgressMap.has(moduleId)) {
            moduleProgressMap.set(moduleId, { completedStages: new Set(), startedAt: null });
          }
          const mp = moduleProgressMap.get(moduleId)!;
          mp.completedStages.add(stageNumber);
          if (!mp.startedAt || rp.completed_at < mp.startedAt) mp.startedAt = rp.completed_at;
        }
      });

      // HUD: Trajectory_Calculation
      const moduleProgresses: ModuleProgress[] = (modules || []).map((m) => {
        const mp = moduleProgressMap.get(m.id);
        const completedStages = mp ? Array.from(mp.completedStages).sort((a, b) => a - b) : [];
        const maxStage = Math.max(...completedStages, 0);
        const isModuleComplete = completedStages.length >= 6; // Standard 6-stage protocol

        return {
          moduleId: m.id,
          completedStages,
          currentStage: isModuleComplete ? 6 : Math.max(maxStage + 1, 1),
          startedAt: mp?.startedAt || null,
          completedAt: isModuleComplete ? new Date().toISOString() : null,
        };
      });

      const completedModules = moduleProgresses.filter((mp) => mp.completedAt).length;
      const totalModules = moduleProgresses.length;
      const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

      setProgress({
        enrollmentId,
        contentId,
        modules: moduleProgresses,
        overallProgress,
        isCompleted: completedModules === totalModules && totalModules > 0,
      });
    } catch (err) {
      console.error("PROGRESS_SYNC_FAULT:", err);
      setError(err instanceof Error ? err : new Error("ARTIFACT_LOAD_FAILURE"));
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId, contentId, talentId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // PHASE: Artifact_Synchronization
  const markStageComplete = useCallback(
    async (moduleId: string, stageNumber: number) => {
      if (!talentId || !moduleId) return false;

      try {
        const { data: resources, error: resourceError } = await supabase
          .from("module_resources")
          .select("id")
          .eq("module_id", moduleId)
          .eq("stage_number", stageNumber);

        if (resourceError) throw resourceError;

        const progressRecords = (resources || []).map((r) => ({
          student_id: talentId,
          resource_id: r.id,
          completed_at: new Date().toISOString(),
        }));

        if (progressRecords.length > 0) {
          const { error: insertError } = await supabase
            .from("student_resource_progress")
            .upsert(progressRecords, { onConflict: "student_id,resource_id" });

          if (insertError) throw insertError;
        }

        // HUD: OPTIMISTIC_SYNC_PROTOCOLS
        setProgress((prev) => {
          if (!prev) return prev;
          const updatedModules = prev.modules.map((m) => {
            if (m.moduleId === moduleId) {
              const newCompletedStages = [...new Set([...m.completedStages, stageNumber])].sort((a, b) => a - b);
              const isModuleComplete = newCompletedStages.length >= 6;
              return {
                ...m,
                completedStages: newCompletedStages,
                currentStage: isModuleComplete ? 6 : Math.max(stageNumber + 1, 1),
                completedAt: isModuleComplete ? new Date().toISOString() : null,
              };
            }
            return m;
          });

          const completedCount = updatedModules.filter((mp) => mp.completedAt).length;
          return {
            ...prev,
            modules: updatedModules,
            overallProgress: Math.round((completedCount / updatedModules.length) * 100),
            isCompleted: completedCount === updatedModules.length,
          };
        });

        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        return true;
      } catch (err) {
        console.error("STAGE_COMPLETION_FAULT:", err);
        return false;
      }
    },
    [talentId, queryClient],
  );

  // PHASE: Viewport_Diagnostic_API
  return {
    progress,
    isLoading,
    error,
    markStageComplete,
    isStageUnlocked: (modId: string, stageNum: number) => {
      const mp = progress?.modules.find((m) => m.moduleId === modId);
      return stageNum === 1 || (mp?.completedStages.includes(stageNum - 1) ?? false);
    },
    isStageCompleted: (modId: string, stageNum: number) =>
      progress?.modules.find((m) => m.moduleId === modId)?.completedStages.includes(stageNum) ?? false,
    getCurrentStage: (modId: string) => progress?.modules.find((m) => m.moduleId === modId)?.currentStage || 1,
    completeEnrollment: async () => {
      if (!enrollmentId || !progress?.isCompleted) return false;
      const { error } = await supabase
        .from("enrollments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", enrollmentId);
      if (!error) queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      return !error;
    },
    reload: loadProgress,
  };
}
