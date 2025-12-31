import { supabase } from "@/integrations/supabase/client";
import { TIMEOUTS } from "@/lib/timeoutConfig";

/**
 * Creates an abortable Supabase query runner.
 * When timeout is reached, the actual network request is cancelled.
 */
export interface AbortableQueryOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
}

/**
 * Execute a Supabase query with proper abort support.
 * This actually cancels the network request when timeout is reached.
 */
export async function abortableQuery<T>(
  queryFn: (signal: AbortSignal) => PromiseLike<{ data: T | null; error: any }>,
  options: AbortableQueryOptions = {}
): Promise<{ data: T | null; error: Error | null; aborted: boolean }> {
  const { timeoutMs = TIMEOUTS.DEFAULT, onTimeout } = options;
  const controller = new AbortController();
  const startTime = Date.now();

  const timeoutId = setTimeout(() => {
    console.warn(`[Query] Aborting after ${timeoutMs}ms`);
    controller.abort();
    onTimeout?.();
  }, timeoutMs);

  try {
    const result = await queryFn(controller.signal);
    clearTimeout(timeoutId);
    
    const elapsed = Date.now() - startTime;
    if (elapsed > 3000) {
      console.log(`[Query] Completed in ${elapsed}ms`);
    }

    if (result.error) {
      return { data: null, error: result.error, aborted: false };
    }
    return { data: result.data, error: null, aborted: false };
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    // Check if it was an abort
    if (err?.name === "AbortError" || controller.signal.aborted) {
      return { 
        data: null, 
        error: new Error("Request timed out. Please try again."), 
        aborted: true 
      };
    }
    
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)), 
      aborted: false 
    };
  }
}

/**
 * Execute multiple Supabase queries with a shared abort controller.
 * All queries are cancelled if timeout is reached.
 */
export async function abortableQueries<T extends readonly unknown[]>(
  queryFns: { [K in keyof T]: (signal: AbortSignal) => PromiseLike<{ data: T[K] | null; error: any }> },
  options: AbortableQueryOptions = {}
): Promise<{ data: T | null; error: Error | null; aborted: boolean }> {
  const { timeoutMs = TIMEOUTS.DEFAULT, onTimeout } = options;
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    console.warn(`[Queries] Aborting all after ${timeoutMs}ms`);
    controller.abort();
    onTimeout?.();
  }, timeoutMs);

  try {
    const results = await Promise.all(
      queryFns.map(fn => fn(controller.signal))
    );
    clearTimeout(timeoutId);

    // Check for errors
    const firstError = results.find(r => r.error);
    if (firstError?.error) {
      return { data: null, error: firstError.error, aborted: false };
    }

    return { 
      data: results.map(r => r.data) as unknown as T, 
      error: null, 
      aborted: false 
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    if (err?.name === "AbortError" || controller.signal.aborted) {
      return { 
        data: null, 
        error: new Error("Request timed out. Please try again."), 
        aborted: true 
      };
    }
    
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err)), 
      aborted: false 
    };
  }
}

/**
 * Check if an error is an abort/timeout error
 */
export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return error.name === "AbortError" || 
           error.message.includes("timed out") ||
           error.message.includes("aborted");
  }
  return false;
}
