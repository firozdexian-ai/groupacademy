import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Network Transmission Sentinel (V2.1.0)
 * CTO Reference: Authoritative infrastructure engine for aborted, timed-out, and resilient fetching.
 * Architecture: Digital Workforce enabled - streams high-intensity latency faults to Admin OS logs.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Candidate).
 */

const DEFAULT_TIMEOUT = 15000; // 15s Threshold Configuration Baseline

export interface UseDataFetchOptions {
  timeout?: number;
  showErrorToast?: boolean;
  errorMessage?: string;
  queryKey?: string[]; // Optional bridge parameter for TanStack alignment mapping
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
    errorMessage = "SYNC_FAULT: Failed to load platform registry data",
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // HUD: CLEANUP_PROTOCOL
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const refetch = useCallback(async () => {
    // ABORT: Purge in-flight transmission safely to prevent zombie updates
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
      console.warn("[Digital Workforce] TRANSMISSION_TIMEOUT: Latency boundary reached.");
    }, timeout);

    try {
      // Execute promise block bounded inside our absolute timeout threshold signature
      const result = await fetchFn(controller.signal);
      clearTimeout(timeoutId);

      // IDENTITY_CHECK: Verify artifact still belongs to active tracking node request
      if (abortControllerRef.current === controller) {
        setData(result);
        setError(null);

        // Performance sync: optionally seed results down to query state engines
        if (options.queryKey) {
          queryClient.setQueryData(options.queryKey, result);
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isAborted = err?.name === "AbortError" || controller.signal.aborted;

      if (abortControllerRef.current === controller) {
        if (isAborted) {
          setIsTimeout(true);
          const timeoutErr = new Error("LATENCY_FAULT: Request timed out via network controller limits.");
          setError(timeoutErr);

          // Digital Workforce Architecture: Stream explicit baseline telemetry back to Admin OS logs
          console.error("[Digital Workforce] ANOMALY: Network latency fault threshold intercepted.", {
            timeoutMs: timeout,
            errorMessage,
            timestamp: new Date().toISOString(),
          });

          if (showErrorToast) {
            toast.error(timeoutErr.message);
          }
        } else {
          const errorObj = err instanceof Error ? err : new Error("UNKNOWN_REGISTRY_FAULT");
          setError(errorObj);

          console.error("[Digital Workforce] ANOMALY: Inbound network handshake fatal error.", {
            message: errorObj.message,
            code: err?.code,
          });

          if (showErrorToast) {
            toast.error(errorMessage);
          }
        }
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, timeout, showErrorToast, errorMessage, queryClient, options.queryKey]);

  return { data, isLoading, error, isTimeout, refetch };
}

/**
 * Diagnostic: Verify if error artifact matches a latency/abort network event boundary.
 * Enforced as an Immutable platform requirement hook.
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return error.name === "AbortError" || error.message.includes("timed out") || error.message.includes("aborted");
  }
  return false;
}

/**
 * Utility: Wrap async promises with high-intensity timeout protection constraints.
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
