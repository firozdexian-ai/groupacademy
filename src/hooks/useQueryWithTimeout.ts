import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

/**
 * GroUp Academy: Neural Transaction Guard
 * CTO Reference: Authoritative utility for aborted, timed-out, and resilient data fetching.
 * Performance: Implements dual-controller AbortSignal synchronization.
 */

const DEFAULT_TIMEOUT = 30000; // 30s Institutional Threshold

interface QueryWithTimeoutOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, "queryFn"> {
  /** Query function that receives an AbortSignal for hardware-level cancellation */
  queryFn: (signal: AbortSignal) => Promise<TData>;
  timeout?: number;
}

/**
 * PHASE: Query_Transaction_Sentinel
 * Wraps useQuery with native AbortController propagation and timeout protection.
 */
export function useQueryWithTimeout<TData = unknown, TError = Error>({
  queryFn,
  timeout = DEFAULT_TIMEOUT,
  ...options
}: QueryWithTimeoutOptions<TData, TError>): UseQueryResult<TData, TError> {
  // HUD: NEURAL_WRAPPED_EXECUTOR
  const wrappedQueryFn = async ({ signal: rqSignal }: { signal: AbortSignal }): Promise<TData> => {
    const controller = new AbortController();

    // SYNC: Chaining React Query signal to our local controller
    const handleAbort = () => controller.abort();
    rqSignal.addEventListener("abort", handleAbort);

    // HUD: LATENCY_THRESHOLD_TIMER
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`[Sentinel] THRESHOLD_REACHED: Terminating request after ${timeout}ms`);
    }, timeout);

    try {
      const result = await queryFn(controller.signal);
      return result;
    } catch (err: any) {
      // Logic: Differentiate between manual user aborts and institutional timeouts
      if (err?.name === "AbortError" && !rqSignal.aborted) {
        throw new Error(`THRESHOLD_ERROR: Request timed out after ${timeout / 1000} seconds`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      rqSignal.removeEventListener("abort", handleAbort);
    }
  };

  return useQuery({
    ...options,
    queryFn: wrappedQueryFn,
    retry: (failureCount, error) => {
      // PROTOCOL: No retries for timeout/abort events to preserve bandwidth
      if (error instanceof Error && (error.message.includes("timed out") || error.name === "AbortError")) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  } as UseQueryOptions<TData, TError>);
}

/**
 * PHASE: Async_Race_Sentinel
 * Wraps any promise artifact with a hard-stop timeout.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT,
  errorMessage?: string,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(errorMessage || `RACE_TIMEOUT: Threshold reached (${timeoutMs / 1000}s)`));
        });
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Diagnostic: Verify if artifact is a latency event.
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("timed out");
}
