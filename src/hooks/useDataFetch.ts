import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

/**
 * GroUp Academy: Network Transmission Sentinel
 * CTO Reference: Authoritative hook for aborted, timed-out, and resilient data fetching.
 * Performance: Prevents memory leaks and ghost updates via AbortController tracking.
 */

const DEFAULT_TIMEOUT = 15000; // 15s Threshold

export interface UseDataFetchOptions {
  timeout?: number;
  showErrorToast?: boolean;
  errorMessage?: string;
}

export interface UseDataFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isTimeout: boolean;
  refetch: () => Promise<void>;
}

export function useDataFetch<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  options: UseDataFetchOptions = {},
): UseDataFetchResult<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    showErrorToast = false,
    errorMessage = "SYNC_FAULT: Failed to load registry data",
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // HUD: CLEANUP_PROTOCOL
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const refetch = useCallback(async () => {
    // ABORT: Purge in-flight transmission
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setIsTimeout(false);

    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn("[Sentinel] TRANSMISSION_TIMEOUT: Threshold reached.");
    }, timeout);

    try {
      const result = await fetchFn(controller.signal);
      clearTimeout(timeoutId);

      // IDENTITY_CHECK: Verify artifact still belongs to active request node
      if (abortControllerRef.current === controller) {
        setData(result);
        setError(null);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      // SYNC: Handle manual aborts vs timed-out aborts
      if (err?.name === "AbortError" || controller.signal.aborted) {
        if (abortControllerRef.current === controller) {
          setIsTimeout(true);
          const timeoutErr = new Error("LATENCY_FAULT: Request timed out.");
          setError(timeoutErr);
          if (showErrorToast) toast.error(timeoutErr.message);
        }
        return;
      }

      if (abortControllerRef.current === controller) {
        const errorObj = err instanceof Error ? err : new Error("UNKNOWN_REGISTRY_FAULT");
        setError(errorObj);
        if (showErrorToast) toast.error(errorMessage);
        console.error("[Sentinel] DATA_FETCH_ERROR:", errorObj);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, timeout, showErrorToast, errorMessage]);

  return { data, isLoading, error, isTimeout, refetch };
}

/**
 * Diagnostic: Verify if error artifact is a latency/abort event.
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return error.name === "AbortError" || error.message.includes("timed out") || error.message.includes("aborted");
  }
  return false;
}

/**
 * Utility: Wrap async promises with high-intensity timeout protection.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  errorMessage?: string,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(errorMessage || `THRESHOLD_ERROR: Limit reached (${timeoutMs / 1000}s)`));
        });
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}
