/**
 * GroUp Academy — Phase 2.2.d
 * Unified progress hook backed by `module_progress` (DB-derived).
 *
 * Reads:
 *   - course_modules (ordered list)
 *   - module_progress (per-module stages_completed, %, completed_at)
 *   - enrollment_stage_progress (resource_view_states for per-resource flags)
 *   - enrollments (overall progress, current_module_id)
 *
 * Writes:
 *   - enrollment_stage_progress only — DB triggers cascade module_progress + enrollments.
 *
 * Realtime: subscribes to module_progress changes for the active enrollment.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const TOTAL_STAGES = 6;

export function useProgress({ enrollmentId, contentId }: UseProgressOptions) {
  const [modules, setModules] = useState<ModuleProgressRow[]>([]);
  const [overallPct, setOverallPct] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [resourceViewStates, setResourceViewStates] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!enrollmentId || !contentId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const [{ data: cmRows, error: cmErr }, { data: mpRows, error: mpErr }, { data: enr, error: enrErr }, { data: espRows }] =
        await Promise.all([
          supabase
            .from("course_modules")
            .select("id, display_order, title")
            .eq("content_id", contentId)
            .order("display_order", { ascending: true }),
          supabase
            .from("module_progress")
            .select("module_id, stages_completed, total_stages, progress_pct, started_at, completed_at")
            .eq("enrollment_id", enrollmentId),
          supabase
            .from("enrollments")
            .select("progress, status, current_module_id")
            .eq("id", enrollmentId)
            .maybeSingle(),
          supabase
            .from("enrollment_stage_progress")
            .select("module_id, resource_view_states")
            .eq("enrollment_id", enrollmentId),
        ]);

      if (cmErr) throw cmErr;
      if (mpErr) throw mpErr;
      if (enrErr) throw enrErr;

      const mpByModule = new Map((mpRows ?? []).map((r: any) => [r.module_id, r]));
      const merged: ModuleProgressRow[] = (cmRows ?? []).map((m: any) => {
        const mp: any = mpByModule.get(m.id);
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

      const rv: Record<string, Record<string, boolean>> = {};
      (espRows ?? []).forEach((row: any) => {
        rv[row.module_id] = (row.resource_view_states as Record<string, boolean>) ?? {};
      });

      setModules(merged);
      setResourceViewStates(rv);
      setOverallPct(enr?.progress ?? 0);
      setIsCompleted(enr?.status === "completed");

      // Resume target: current_module_id, else first incomplete, else first module
      const resume =
        enr?.current_module_id ??
        merged.find((m) => m.progressPct < 100)?.moduleId ??
        merged[0]?.moduleId ??
        null;
      setCurrentModuleId(resume);
    } catch (e: any) {
      console.error("[useProgress] load fault:", e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId, contentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refresh on module_progress changes for this enrollment
  useEffect(() => {
    if (!enrollmentId) return;
    const ch = supabase
      .channel(`module_progress:${enrollmentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "module_progress", filter: `enrollment_id=eq.${enrollmentId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [enrollmentId, load]);

  // ---------- Mutations (write only to enrollment_stage_progress) ----------

  const upsertStage = useCallback(
    async (moduleId: string, patch: { completed_stages?: number[]; current_stage?: number; resource_view_states?: Record<string, boolean> }) => {
      if (!enrollmentId) return;
      const existing = modules.find((m) => m.moduleId === moduleId);
      const completed = patch.completed_stages ?? existing?.stagesCompleted ?? [];
      const currentStage = patch.current_stage ?? Math.min(TOTAL_STAGES, Math.max(...completed, 0) + 1);
      const rvs = patch.resource_view_states ?? resourceViewStates[moduleId] ?? {};

      const { error: upErr } = await supabase.from("enrollment_stage_progress").upsert(
        {
          enrollment_id: enrollmentId,
          module_id: moduleId,
          completed_stages: completed,
          current_stage: currentStage,
          resource_view_states: rvs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "enrollment_id,module_id" },
      );
      if (upErr) throw upErr;
    },
    [enrollmentId, modules, resourceViewStates],
  );

  const markStageComplete = useCallback(
    async (moduleId: string, stage: number) => {
      const m = modules.find((x) => x.moduleId === moduleId);
      const next = Array.from(new Set([...(m?.stagesCompleted ?? []), stage])).sort((a, b) => a - b);
      // Optimistic
      setModules((prev) =>
        prev.map((x) =>
          x.moduleId === moduleId
            ? {
                ...x,
                stagesCompleted: next,
                progressPct: Math.min(100, Math.round((next.length / TOTAL_STAGES) * 100)),
              }
            : x,
        ),
      );
      try {
        await upsertStage(moduleId, { completed_stages: next, current_stage: Math.min(TOTAL_STAGES, stage + 1) });
      } catch (e) {
        console.error("[useProgress] markStageComplete fault:", e);
        load();
      }
    },
    [modules, upsertStage, load],
  );

  const markResourceViewed = useCallback(
    async (moduleId: string, resourceId: string) => {
      const cur = resourceViewStates[moduleId] ?? {};
      if (cur[resourceId]) return;
      const nextRv = { ...cur, [resourceId]: true };
      setResourceViewStates((prev) => ({ ...prev, [moduleId]: nextRv }));
      try {
        await upsertStage(moduleId, { resource_view_states: nextRv });
      } catch (e) {
        console.error("[useProgress] markResourceViewed fault:", e);
      }
    },
    [resourceViewStates, upsertStage],
  );

  const setCurrentModule = useCallback(
    async (moduleId: string) => {
      setCurrentModuleId(moduleId);
      if (!enrollmentId) return;
      await supabase
        .from("enrollments")
        .update({ current_module_id: moduleId, last_accessed_at: new Date().toISOString() })
        .eq("id", enrollmentId);
    },
    [enrollmentId],
  );

  // ---------- Selectors ----------

  const isStageUnlocked = useCallback(
    (moduleId: string, stage: number) => {
      if (stage <= 1) return true;
      const m = modules.find((x) => x.moduleId === moduleId);
      return m?.stagesCompleted.includes(stage - 1) ?? false;
    },
    [modules],
  );

  const isStageCompleted = useCallback(
    (moduleId: string, stage: number) =>
      modules.find((x) => x.moduleId === moduleId)?.stagesCompleted.includes(stage) ?? false,
    [modules],
  );

  const getCurrentStage = useCallback(
    (moduleId: string) => {
      const m = modules.find((x) => x.moduleId === moduleId);
      if (!m) return 1;
      if (m.progressPct >= 100) return TOTAL_STAGES;
      return Math.min(TOTAL_STAGES, Math.max(...m.stagesCompleted, 0) + 1);
    },
    [modules],
  );

  const isResourceViewed = useCallback(
    (moduleId: string, resourceId: string) => Boolean(resourceViewStates[moduleId]?.[resourceId]),
    [resourceViewStates],
  );

  const completedModuleCount = useMemo(() => modules.filter((m) => m.progressPct >= 100).length, [modules]);

  return {
    modules,
    overallPct,
    isCompleted,
    completedModuleCount,
    totalModules: modules.length,
    currentModuleId,
    setCurrentModule,
    markStageComplete,
    markResourceViewed,
    isStageUnlocked,
    isStageCompleted,
    getCurrentStage,
    isResourceViewed,
    isLoading,
    error,
    reload: load,
  };
}
