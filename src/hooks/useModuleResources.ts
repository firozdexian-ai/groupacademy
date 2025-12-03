import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  return useQuery({
    queryKey: ["module-resources", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];

      const { data, error } = await supabase
        .from("module_resources")
        .select("*")
        .eq("module_id", moduleId)
        .order("stage_number")
        .order("display_order");

      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId,
  });
}

export function useModuleResourcesByStage(moduleId: string | undefined) {
  const { data: resources, ...rest } = useModuleResources(moduleId);

  const resourcesByStage: StageResources[] = [1, 2, 3, 4, 5, 6].map((stage) => ({
    stage,
    stageName: stageNames[stage],
    resources: resources?.filter((r) => r.stage_number === stage) || [],
  }));

  return {
    ...rest,
    data: resourcesByStage,
    allResources: resources,
  };
}

export function useStudentResourceProgress(studentId: string | undefined, moduleId: string | undefined) {
  return useQuery({
    queryKey: ["student-resource-progress", studentId, moduleId],
    queryFn: async () => {
      if (!studentId || !moduleId) return [];

      const { data: resources } = await supabase
        .from("module_resources")
        .select("id")
        .eq("module_id", moduleId);

      if (!resources?.length) return [];

      const resourceIds = resources.map((r) => r.id);

      const { data, error } = await supabase
        .from("student_resource_progress")
        .select("*")
        .eq("student_id", studentId)
        .in("resource_id", resourceIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && !!moduleId,
  });
}
