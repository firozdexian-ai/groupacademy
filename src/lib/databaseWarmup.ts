import { supabase } from "@/integrations/supabase/client";
import { TIMEOUTS } from "@/lib/timeoutConfig";

/**
 * GroUp Academy: Neural Latency Prefetcher
 * CTO Reference: Authoritative controller for database cold-start mitigation.
 * Logic: Implements best-effort, non-blocking singleton handshakes.
 */

let warmupPromise: Promise<void> | null = null;

// HUD: Institutional Max Duration - strictly time-boxed to 8 seconds.
const WARMUP_MAX_MS = 8000;

/**
 * PHASE: Database_Handshake_Warmup
 * Warms up the PostgREST connection to reduce TTI for first-request artifacts.
 * Performance: Atomic, safe for redundant calls, strictly best-effort.
 */
export function warmupDatabase(): Promise<void> {
  if (warmupPromise) return warmupPromise;

  const startTime = Date.now();
  console.log("[Sentinel] Initiating database warmup sequence...");

  warmupPromise = new Promise<void>((resolve) => {
    const controller = new AbortController();

    // HUD: HARD_LIMIT_SENTINEL
    const hardTimeout = setTimeout(() => {
      console.warn(`[Sentinel] Warmup hard-limit reached (${WARMUP_MAX_MS}ms)`);
      controller.abort();
      resolve();
    }, WARMUP_MAX_MS);

    // HUD: SOFT_LIMIT_SENTINEL (Config-driven)
    const softTimeout = setTimeout(() => {
      console.warn(`[Sentinel] Soft timeout limit reached (${TIMEOUTS.COLD_START}ms)`);
      controller.abort();
    }, TIMEOUTS.COLD_START);

    // ACTION: Execute lightweight registry audit
    const query = supabase.from("profession_categories").select("id").limit(1).abortSignal(controller.signal);

    Promise.resolve(query)
      .then(() => {
        console.log(`[Sentinel] Database ready for trajectory. Ingress: ${Date.now() - startTime}ms`);
      })
      .catch((error: unknown) => {
        const err = error as { name?: string; message?: string };
        // LOG: Silent failure for best-effort tasks
        if (err?.name !== "AbortError") {
          console.warn("[Sentinel] Warmup query unsuccessful:", err?.message || error);
        }
      })
      .finally(() => {
        clearTimeout(hardTimeout);
        clearTimeout(softTimeout);
        resolve(); // Ensure promise always resolves
      });
  });

  return warmupPromise;
}

/**
 * Diagnostic: Purge warmup registry for testing environments.
 */
export function resetWarmupForDebug() {
  warmupPromise = null;
}
