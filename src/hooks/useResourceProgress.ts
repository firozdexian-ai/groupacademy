import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ResourceState {
  done?: boolean;
  sec?: number;
  updated_at?: string;
}

type ResourceStateMap = Record<string, ResourceState>;

interface UseResourceProgressArgs {
  enrollmentId?: string;
  moduleId?: string;
}

/**
 * Per-resource persistence (watch position, read state) stored in
 * `enrollment_stage_progress.resource_state` as a JSON map.
 */
export function useResourceProgress({ enrollmentId, moduleId }: UseResourceProgressArgs) {
  const cacheRef = useRef<ResourceStateMap>({});
  const pendingRef = useRef<ResourceStateMap>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate cache when module changes
  useEffect(() => {
    cacheRef.current = {};
    pendingRef.current = {};
    if (!enrollmentId || !moduleId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("enrollment_stage_progress")
        .select("resource_state")
        .eq("enrollment_id", enrollmentId)
        .eq("module_id", moduleId)
        .maybeSingle();
      if (cancelled) return;
      cacheRef.current = ((data?.resource_state as ResourceStateMap) ?? {}) || {};
    })();
    return () => {
      cancelled = true;
    };
  }, [enrollmentId, moduleId]);

  const flush = async () => {
    if (!enrollmentId || !moduleId) return;
    const merged = { ...cacheRef.current, ...pendingRef.current };
    cacheRef.current = merged;
    pendingRef.current = {};
    await supabase
      .from("enrollment_stage_progress")
      .update({ resource_state: merged as any })
      .eq("enrollment_id", enrollmentId)
      .eq("module_id", moduleId);
  };

  const scheduleFlush = () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      void flush();
    }, 1500);
  };

  const update = (resourceId: string, patch: ResourceState) => {
    pendingRef.current[resourceId] = {
      ...(cacheRef.current[resourceId] ?? {}),
      ...(pendingRef.current[resourceId] ?? {}),
      ...patch,
      updated_at: new Date().toISOString(),
    };
    scheduleFlush();
  };

  const markDone = (resourceId: string) => update(resourceId, { done: true });

  const get = (resourceId: string): ResourceState =>
    pendingRef.current[resourceId] ?? cacheRef.current[resourceId] ?? {};

  const isDone = (resourceId: string) => get(resourceId).done === true;

  return { update, markDone, get, isDone, flush };
}
