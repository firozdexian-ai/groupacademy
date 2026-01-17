import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

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

  // Load progress from database
  const loadProgress = useCallback(async () => {
    if (!enrollmentId || !contentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get all modules for this content
      const { data: modules, error: modulesError } = await supabase
        .from("course_modules")
        .select("id, display_order, title")
        .eq("content_id", contentId)
        .order("display_order", { ascending: true });

      if (modulesError) throw modulesError;

      // Get existing progress from student_resource_progress
      const { data: resourceProgress, error: progressError } = await supabase
        .from("student_resource_progress")
        .select("resource_id, completed_at, module_resources!inner(module_id, stage_number)")
        .eq("student_id", talentId || "");

      if (progressError && progressError.code !== "PGRST116") {
        throw progressError;
      }

      // Build module progress map
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
          if (!mp.startedAt || rp.completed_at < mp.startedAt) {
            mp.startedAt = rp.completed_at;
          }
        }
      });

      // Build course progress
      const moduleProgresses: ModuleProgress[] = (modules || []).map((m) => {
        const mp = moduleProgressMap.get(m.id);
        const completedStages = mp ? Array.from(mp.completedStages).sort((a, b) => a - b) : [];
        const maxStage = Math.max(...completedStages, 0);
        const isModuleComplete = completedStages.length >= 6; // 6 stages total

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
      console.error("Error loading course progress:", err);
      setError(err instanceof Error ? err : new Error("Failed to load progress"));
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId, contentId, talentId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Save stage completion to database
  const markStageComplete = useCallback(
    async (moduleId: string, stageNumber: number) => {
      if (!talentId || !moduleId) return false;

      try {
        // Get resource IDs for this stage
        const { data: resources, error: resourceError } = await supabase
          .from("module_resources")
          .select("id")
          .eq("module_id", moduleId)
          .eq("stage_number", stageNumber);

        if (resourceError) throw resourceError;

        // Mark each resource as completed
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

        // Optimistically update local state
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

          const completedModules = updatedModules.filter((mp) => mp.completedAt).length;
          const totalModules = updatedModules.length;

          return {
            ...prev,
            modules: updatedModules,
            overallProgress: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
            isCompleted: completedModules === totalModules && totalModules > 0,
          };
        });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });

        return true;
      } catch (err) {
        console.error("Error marking stage complete:", err);
        return false;
      }
    },
    [talentId, queryClient]
  );

  // Get progress for a specific module
  const getModuleProgress = useCallback(
    (moduleId: string): ModuleProgress | null => {
      return progress?.modules.find((m) => m.moduleId === moduleId) || null;
    },
    [progress]
  );

  // Check if a stage is unlocked
  const isStageUnlocked = useCallback(
    (moduleId: string, stageNumber: number): boolean => {
      const moduleProgress = getModuleProgress(moduleId);
      if (!moduleProgress) return stageNumber === 1;
      if (stageNumber === 1) return true;
      return moduleProgress.completedStages.includes(stageNumber - 1);
    },
    [getModuleProgress]
  );

  // Check if a stage is completed
  const isStageCompleted = useCallback(
    (moduleId: string, stageNumber: number): boolean => {
      const moduleProgress = getModuleProgress(moduleId);
      return moduleProgress?.completedStages.includes(stageNumber) || false;
    },
    [getModuleProgress]
  );

  // Get the current stage for a module
  const getCurrentStage = useCallback(
    (moduleId: string): number => {
      const moduleProgress = getModuleProgress(moduleId);
      return moduleProgress?.currentStage || 1;
    },
    [getModuleProgress]
  );

  // Complete the enrollment when all modules are done
  const completeEnrollment = useCallback(async () => {
    if (!enrollmentId || !progress?.isCompleted) return false;

    try {
      const { error } = await supabase
        .from("enrollments")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", enrollmentId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      return true;
    } catch (err) {
      console.error("Error completing enrollment:", err);
      return false;
    }
  }, [enrollmentId, progress?.isCompleted, queryClient]);

  return {
    progress,
    isLoading,
    error,
    markStageComplete,
    getModuleProgress,
    isStageUnlocked,
    isStageCompleted,
    getCurrentStage,
    completeEnrollment,
    reload: loadProgress,
  };
}
