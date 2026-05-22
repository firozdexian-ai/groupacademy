import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCourseModulesByContent,
  listStudentResourceProgressFull,
  listModuleResourceIdsByStage,
  upsertStudentResourceProgress,
  markEnrollmentCompleted,
} from "@/domains/learning/repo/learningRepo";
import { useToast } from "@/hooks/use-toast";

/**
 * GroUp Academy: Pedagogical Progress Orchestrator (V4.2.8)
 * CTO Reference: Authoritative system engine for 6-stage trajectory tracking and stage unlocking.
 * Architecture: Digital Workforce enabled - streams sync dropouts directly to Admin Chat.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export interface ModuleProgress {
  moduleId: string;
  completedStages: number[];
  currentStage: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CourseProgress {
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // --------------------------------------------------------
  // PHASE: Registry_Ingress & Core Telemetry Sync
  // --------------------------------------------------------
  const {
    data: progress,
    isLoading,
    error,
    refetch: reload,
  } = useQuery({
    queryKey: ["course-progress", enrollmentId, contentId, talentId],
    enabled: !!enrollmentId && !!contentId && !!talentId,
    staleTime: 2 * 60 * 1000, // 2-minute performance consistency baseline
    queryFn: async (): Promise<CourseProgress | null> => {
      // HUD: Fetch_Module_Architecture
      let modules: any[] = [];
      try {
        modules = await listCourseModulesByContent(contentId!);
      } catch (modulesError) {
        console.error("[Digital Workforce] FAULT: course_modules extraction failed schema bounds.", modulesError);
        throw modulesError;
      }

      // HUD: Fetch_Interaction_Telemetry
      let resourceProgress: any[] = [];
      try {
        resourceProgress = await listStudentResourceProgressFull(talentId!);
      } catch (progressError: any) {
        console.error("[Digital Workforce] FAULT: student_resource_progress telemetry query failure.", progressError);
        throw progressError;
      }

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

      // HUD: Trajectory_Calculation
      const moduleProgresses: ModuleProgress[] = (modules || []).map((m) => {
        const mp = moduleProgressMap.get(m.id);
        const completedStages = mp ? Array.from(mp.completedStages).sort((a, b) => a - b) : [];
        const maxStage = Math.max(...completedStages, 0);
        const isModuleComplete = completedStages.length >= 6; // Standard 6-stage protocol verification

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

      return {
        enrollmentId: enrollmentId!,
        contentId: contentId!,
        modules: moduleProgresses,
        overallProgress,
        isCompleted: completedModules === totalModules && totalModules > 0,
      };
    },
  });

  // --------------------------------------------------------
  // PHASE: Artifact_Synchronization Mutation
  // --------------------------------------------------------
  const stageMutation = useMutation({
    mutationFn: async ({ moduleId, stageNumber }: { moduleId: string; stageNumber: number }) => {
      if (!talentId || !moduleId) throw new Error("BAD_MUTATION_ARGS: Missing identity or module context keys.");

      const resources = await listModuleResourceIdsByStage(moduleId, stageNumber);

      const progressRecords = (resources || []).map((r) => ({
        student_id: talentId,
        resource_id: r.id,
        completed_at: new Date().toISOString(),
      }));

      if (progressRecords.length > 0) {
        await upsertStudentResourceProgress(progressRecords);
      }
    },
    onMutate: async ({ moduleId, stageNumber }) => {
      // Optimistic UI synchronization matrix
      await queryClient.cancelQueries({ queryKey: ["course-progress", enrollmentId, contentId, talentId] });
      const previousProgress = queryClient.getQueryData<CourseProgress>([
        "course-progress",
        enrollmentId,
        contentId,
        talentId,
      ]);

      if (previousProgress) {
        const updatedModules = previousProgress.modules.map((m) => {
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
        queryClient.setQueryData(["course-progress", enrollmentId, contentId, talentId], {
          ...previousProgress,
          modules: updatedModules,
          overallProgress: Math.round((completedCount / updatedModules.length) * 100),
          isCompleted: completedCount === updatedModules.length,
        });
      }

      return { previousProgress };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(["course-progress", enrollmentId, contentId, talentId], context.previousProgress);
      }

      // Digital Workforce Anomaly Sensor: Critical payload for track-sweeps and operational logs
      console.error("[Digital Workforce] ANOMALY: STAGE_COMPLETION_FAULT enqueued.", {
        talentId,
        moduleId: variables.moduleId,
        stageNumber: variables.stageNumber,
        error: err.message,
      });

      toast({ title: "Progress sync failed", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", enrollmentId, contentId, talentId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });

  // --------------------------------------------------------
  // PHASE: Viewport_Diagnostic_API (Immutable Handlers Matrix)
  // --------------------------------------------------------
  const isStageUnlocked = (modId: string, stageNum: number): boolean => {
    const mp = progress?.modules.find((m) => m.moduleId === modId);
    return stageNum === 1 || (mp?.completedStages.includes(stageNum - 1) ?? false);
  };

  const isStageCompleted = (modId: string, stageNum: number): boolean => {
    return progress?.modules.find((m) => m.moduleId === modId)?.completedStages.includes(stageNum) ?? false;
  };

  const getCurrentStage = (modId: string): number => {
    return progress?.modules.find((m) => m.moduleId === modId)?.currentStage || 1;
  };

  const completeEnrollment = async (): Promise<boolean> => {
    if (!enrollmentId || !progress?.isCompleted) return false;

    const { error } = await markEnrollmentCompleted(enrollmentId);

    if (error) {
      console.error("[Digital Workforce] ANOMALY: completeEnrollment ledger state mutation failed.", error);
      return false;
    }

    await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    return true;
  };

  return {
    progress: progress || null,
    isLoading,
    error: error as Error | null,
    markStageComplete: async (moduleId: string, stageNumber: number) => {
      try {
        await stageMutation.mutateAsync({ moduleId, stageNumber });
        return true;
      } catch {
        return false;
      }
    },
    isStageUnlocked,
    isStageCompleted,
    getCurrentStage,
    completeEnrollment,
    reload,
  };
}
