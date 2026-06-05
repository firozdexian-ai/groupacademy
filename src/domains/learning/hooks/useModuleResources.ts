import { useMemo } from "react";
import {
  listModuleResourcesForModule,
  listStudentResourceProgress,
} from "@/domains/learning/repo/learningRepo";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import type { Database } from "@/integrations/supabase/types";

/**
 * GroUp Academy: Curriculum Resource Sentinel (V5.6.0)
 * Architecture: Repo-pattern enforced; Supabase calls live in learningRepo.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

export interface StageResources {
  stage: number;
  stageName: string;
  resources: ModuleResource[];
}

const stageNames: Record<number, string> = {
  1: "Orientation",
  2: "Learn",
  3: "Discuss",
  4: "Practice",
  5: "Assess",
  6: "Progress",
};

export function useModuleResources(moduleId: string | undefined) {
  return useQueryWithTimeout({
    queryKey: ["module-resources", moduleId],
    queryFn: async (): Promise<ModuleResource[]> => {
      if (!moduleId) return [];
      try {
        const data = await listModuleResourcesForModule(moduleId);
        return (data ?? []) as ModuleResource[];
      } catch (error) {
        console.error("[Digital Workforce] ANOMALY: module_resources ingress failure.", error);
        throw error;
      }
    },
    enabled: !!moduleId,
    timeout: TIMEOUTS.DEFAULT,
  });
}

export function useModuleResourcesByStage(moduleId: string | undefined) {
  const { data: resources, ...rest } = useModuleResources(moduleId);

  const resourcesByStage: StageResources[] = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((stage) => ({
      stage,
      stageName: stageNames[stage],
      resources: resources?.filter((r) => r.stage_number === stage) || [],
    }));
  }, [resources]);

  return {
    ...rest,
    data: resourcesByStage,
    allResources: resources,
  };
}

export function useStudentResourceProgress(studentId: string | undefined, moduleId: string | undefined) {
  return useQueryWithTimeout({
    queryKey: ["student-resource-progress", studentId, moduleId],
    queryFn: async () => {
      if (!studentId || !moduleId) return [];
      try {
        return await listStudentResourceProgress(studentId, moduleId);
      } catch (error) {
        console.error("[Digital Workforce] ANOMALY: student_resource_progress audit failed.", error);
        throw error;
      }
    },
    enabled: !!studentId && !!moduleId,
    timeout: TIMEOUTS.DEFAULT,
  });
}
