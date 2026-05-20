import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import type { Database } from "@/integrations/supabase/types";

/**
 * GroUp Academy: Curriculum Resource Sentinel (V5.6.0)
 * CTO Reference: Authoritative controller for 6-Stage pedagogical content delivery.
 * Architecture: Digital Workforce enabled - logs curriculum drops to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

export interface StageResources {
  stage: number;
  stageName: string;
  resources: ModuleResource[];
}

// HUD: Institutional Stage Definitions (Immutable Platform Standard)
const stageNames: Record<number, string> = {
  1: "Orientation",
  2: "Learn",
  3: "Discuss",
  4: "Practice",
  5: "Assess",
  6: "Progress",
};

/**
 * PHASE: Resource_Ingress
 * Retrieves all curriculum artifacts for a specific module node.
 */
export function useModuleResources(moduleId: string | undefined) {
  return useQueryWithTimeout({
    queryKey: ["module-resources", moduleId],
    queryFn: async (): Promise<ModuleResource[]> => {
      if (!moduleId) return [];

      // HUD: ATOMIC_CURRICULUM_SELECT
      const { data, error } = await supabase
        .from("module_resources")
        .select("*")
        .eq("module_id", moduleId)
        .order("stage_number", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) {
        console.error("[Digital Workforce] ANOMALY: module_resources ingress failure.", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!moduleId,
    timeout: TIMEOUTS.DEFAULT,
  });
}

/**
 * PHASE: Stage_Partitioning
 * Reconfigures raw resources into the 6-Stage executive model using stable memoization.
 */
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

/**
 * PHASE: Progress_Audit
 * Verifies resource completion via a single-trip relational lookup.
 */
export function useStudentResourceProgress(studentId: string | undefined, moduleId: string | undefined) {
  return useQueryWithTimeout({
    queryKey: ["student-resource-progress", studentId, moduleId],
    queryFn: async () => {
      if (!studentId || !moduleId) return [];

      // HUD: COLLAPSED_RELATIONAL_PROGRESS_AUDIT
      // Directly queries the interaction ledger filtered by parent module context
      const { data, error } = await supabase
        .from("student_resource_progress")
        .select(
          `
          *,
          resource:resource_id!inner(module_id)
        `,
        )
        .eq("student_id", studentId)
        .eq("resource.module_id", moduleId);

      if (error) {
        console.error("[Digital Workforce] ANOMALY: student_resource_progress audit failed.", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!studentId && !!moduleId,
    timeout: TIMEOUTS.DEFAULT,
  });
}
