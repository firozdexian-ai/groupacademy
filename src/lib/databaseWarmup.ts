import { supabase } from "@/integrations/supabase/client";
import { TIMEOUTS } from "@/lib/timeoutConfig";

let warmupPromise: Promise<void> | null = null;

/**
 * Warms up the backend connection to reduce first-request cold-start time.
 * Safe to call multiple times; only the first call will do work.
 */
export function warmupDatabase(): Promise<void> {
  if (warmupPromise) return warmupPromise;

  warmupPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.COLD_START);

    try {
      // Minimal, read-only query against a public-facing table.
      // We intentionally ignore errors here; it's a best-effort warmup.
      await supabase
        .from("profession_categories")
        .select("id")
        .limit(1)
        .abortSignal(controller.signal);
    } catch {
      // Best-effort only
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  return warmupPromise;
}

export function resetWarmupForDebug() {
  warmupPromise = null;
}
