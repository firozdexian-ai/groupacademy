import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

/**
 * GroUp Academy: Neural Database Sentinel (V5.6.0)
 * CTO Reference: Authoritative infrastructure utility managing network cancellation and lazy data ingress.
 * Architecture: Optimized via TanStack Mutation Primitives to completely eradicate state reference thrashing.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface UseSupabaseQueryOptions {
  timeout?: number;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isTimeout: boolean;
  execute: () => Promise<T | null>;
  abort: () => void;
}

/**
 * Wraps dynamic lazy database executions with native AbortSignal propagation and atomic thresholds.
 */
export function useSupabaseQuery<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  options: UseSupabaseQueryOptions = {},
): UseSupabaseQueryResult<T> {
  const { timeout = 15000, onError, onTimeout } = options;

  // Storing mutable callback layers inside references to secure dependency stability
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const localAbortControllerRef = useRef<AbortController | null>(null);

  // --- HUD: TRANSPARENT_MUTATION_ORCHESTRATOR ---
  const mutation = useMutation<T, Error, void>({
    mutationKey: ["supabase-sentinel-query"],
    mutationFn: async (): Promise<T> => {
      // Clear previous in-flight requests before launching a clean transaction pass
      if (localAbortControllerRef.current) {
        localAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      localAbortControllerRef.current = controller;

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      // Construct an absolute deadline promise matching target configurations
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          // HUD: SEVERING_LATENT_NETWORK_TRANSMISSION
          controller.abort();

          console.warn(
            `[Digital Workforce] ANOMALY: Database Sentinel timeout threshold triggered after ${timeout}ms.`,
          );

          if (onTimeout) onTimeout();
          reject(new Error(`THRESHOLD_ERROR: Request timed out after ${timeout / 1000}s`));
        }, timeout);
      });

      try {
        // Race the underlying query execution directly against our hard boundary timer
        return await Promise.race([queryFnRef.current(controller.signal), timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    },
    onError: (err) => {
      if (err.message.includes("THRESHOLD_ERROR")) return;
      if (onError) onError(err);
    },
  });

  // --- PHASE: MUTATION_PROXY_INTERFACES ---

  const abort = useCallback(() => {
    if (localAbortControllerRef.current) {
      // HUD: EXECUTING_MANUAL_TRANSMISSION_SEVERANCE
      localAbortControllerRef.current.abort();
      localAbortControllerRef.current = null;
    }
    mutation.reset();
  }, [mutation]);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      return await mutation.mutateAsync();
    } catch (err: any) {
      // Return null fallback states if request was cancelled or timed out
      if (err?.name === "AbortError" || err?.message?.includes("THRESHOLD_ERROR")) {
        return null;
      }
      return null;
    }
  }, [mutation]);

  const isTimeoutErrorResult = mutation.error?.message?.includes("THRESHOLD_ERROR") ?? false;

  return {
    data: mutation.data ?? null,
    loading: mutation.isPending,
    error: isTimeoutErrorResult ? mutation.error : mutation.error || null,
    isTimeout: isTimeoutErrorResult,
    execute,
    abort,
  };
}

/**
 * Utility: Procedural execution with hard-stop timeout thresholds.
 */
export async function executeWithAbort<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 15000,
): Promise<T> {
  const controller = new AbortController();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`RACE_TIMEOUT: Threshold reached (${timeoutMs / 1000}s)`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([queryFn(controller.signal), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Diagnostic: Verify if target error corresponds to a latency exception tracker.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("timed out") ||
      error.message.includes("RACE_TIMEOUT") ||
      error.message.includes("THRESHOLD_ERROR")
    );
  }
  return false;
}
