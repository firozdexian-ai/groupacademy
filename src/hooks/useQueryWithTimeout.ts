import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

interface QueryWithTimeoutOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, "queryFn"> {
  /** Query function that receives an AbortSignal for proper cancellation */
  queryFn: (signal: AbortSignal) => Promise<TData>;
  timeout?: number;
}

/**
 * Custom hook that wraps useQuery with real abort support
 * Uses AbortSignal to actually cancel network requests on timeout
 */
export function useQueryWithTimeout<TData = unknown, TError = Error>({
  queryFn,
  timeout = DEFAULT_TIMEOUT,
  ...options
}: QueryWithTimeoutOptions<TData, TError>): UseQueryResult<TData, TError> {
  
  // Wrap queryFn to use the signal from React Query AND add timeout
  const wrappedQueryFn = async ({ signal }: { signal: AbortSignal }): Promise<TData> => {
    const controller = new AbortController();
    
    // Abort our controller when React Query's signal aborts
    const handleAbort = () => controller.abort();
    signal.addEventListener("abort", handleAbort);
    
    // Set up timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await queryFn(controller.signal);
      return result;
    } catch (err: any) {
      // Convert abort to timeout error if our timeout triggered it
      if (err?.name === "AbortError" && !signal.aborted) {
        throw new Error(`Request timed out after ${timeout / 1000} seconds`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", handleAbort);
    }
  };

  return useQuery({
    ...options,
    queryFn: wrappedQueryFn,
    retry: (failureCount, error) => {
      // Don't retry on timeout/abort errors
      if (error instanceof Error && (
        error.message.includes("timed out") ||
        error.name === "AbortError"
      )) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  } as UseQueryOptions<TData, TError>);
}

/**
 * Utility function to wrap any async function with a timeout
 * Useful for edge function calls and other async operations
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT,
  errorMessage?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(errorMessage || `Request timed out after ${timeoutMs / 1000} seconds`));
        });
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("timed out");
}
