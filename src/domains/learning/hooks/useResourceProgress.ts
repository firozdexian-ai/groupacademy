import { useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Video Playback & Progress Sentinel (V5.6.0)
 * CTO Reference: High-frequency buffer syncing tracking watch positions with zero race conditions.
 * Architecture: Snapshot-isolated flushes preventing overwrite drops during active transport transits.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface ResourceState {
  done?: boolean;
  sec?: number;
  updated_at?: string;
}

export type ResourceStateMap = Record<string, ResourceState>;

interface UseResourceProgressArgs {
  enrollmentId?: string;
  moduleId?: string;
}

/**
 * Coordinates high-frequency resource state serialization inside a buffered cache shell.
 */
export function useResourceProgress({ enrollmentId, moduleId }: UseResourceProgressArgs) {
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["resource-json-state", enrollmentId, moduleId], [enrollmentId, moduleId]);

  const cacheRef = useRef<ResourceStateMap>({});
  const pendingRef = useRef<ResourceStateMap>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushing = useRef<boolean>(false);

  // --- SENSOR: CORE_DOCUMENT_STATE_QUERY ---
  const { refetch } = useQuery({
    queryKey,
    enabled: !!enrollmentId && !!moduleId,
    staleTime: Infinity, // Rely completely on local buffers and explicit mutations
    queryFn: async () => {
      // HUD: INITIALIZING_RESOURCE_STATE_HYDRATION
      const { data, error } = await supabase
        .from("enrollment_stage_progress")
        .select("resource_state")
        .eq("enrollment_id", enrollmentId!)
        .eq("module_id", moduleId!)
        .maybeSingle();

      if (error) {
        console.error("[Digital Workforce] FAULT: enrollment_stage_progress json b-tree read dropped.", error);
        throw error;
      }

      const initialMap = (data?.resource_state as ResourceStateMap) || {};
      cacheRef.current = initialMap;
      return initialMap;
    },
  });

  // Synchronize internal cache maps whenever parent context targets mutate
  useEffect(() => {
    cacheRef.current = {};
    pendingRef.current = {};
    if (flushTimer.current) clearTimeout(flushTimer.current);

    if (enrollmentId && moduleId) {
      void refetch();
    }
  }, [enrollmentId, moduleId, refetch]);

  // --- ACTION: ISOLATED_STATE_TRANSACTION_MUTATION ---
  const syncMutation = useMutation({
    mutationFn: async (payload: ResourceStateMap) => {
      if (!enrollmentId || !moduleId) return;

      // HUD: EXECUTING_JSONB_DOCUMENT_UPDATE_SYNC
      const { error } = await supabase
        .from("enrollment_stage_progress")
        .update({ resource_state: payload as any })
        .eq("enrollment_id", enrollmentId)
        .eq("module_id", moduleId);

      if (error) {
        throw error;
      }
    },
    onError: (err: any) => {
      // Digital Workforce Anomaly Trigger: Imprints tracing packets for background monitoring agents
      console.error("[Digital Workforce] ANOMALY: Buffered tracking snapshot flush failed.", {
        enrollmentId,
        moduleId,
        message: err.message,
      });
    },
  });

  const flush = async () => {
    if (!enrollmentId || !moduleId || isFlushing.current) return;

    const pendingKeys = Object.keys(pendingRef.current);
    if (pendingKeys.length === 0) return;

    isFlushing.current = true;

    // HUD: CAPTURING_SNAPSHOT_TRANSACTION
    // Isolate current mutations to allow high-frequency inputs to continue streaming cleanly
    const snapshotToFlush = { ...pendingRef.current };
    const mergedPayload = { ...cacheRef.current, ...snapshotToFlush };

    // Clear matching keys from the active tracking bucket
    pendingKeys.forEach((key) => {
      delete pendingRef.current[key];
    });

    try {
      await syncMutation.mutateAsync(mergedPayload);
      cacheRef.current = mergedPayload;
    } catch {
      // Roll back un-flushed snapshot changes back into the pending tracking object map on failure
      pendingRef.current = { ...snapshotToFlush, ...pendingRef.current };
    } finally {
      isFlushing.current = false;

      // If new progress mutations trickled down during transit, schedule another completion check
      if (Object.keys(pendingRef.current).length > 0) {
        scheduleFlush();
      }
    }
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

  const markDone = (resourceId: string) => {
    update(resourceId, { done: true });
    // Invalidate related progress indicators globally to keep totals aligned
    void qc.invalidateQueries({ queryKey: ["enrollment-progression"] });
  };

  const get = (resourceId: string): ResourceState => {
    return pendingRef.current[resourceId] ?? cacheRef.current[resourceId] ?? {};
  };

  const isDone = (resourceId: string) => get(resourceId).done === true;

  return {
    update,
    markDone,
    get,
    isDone,
    flush,
  };
}
