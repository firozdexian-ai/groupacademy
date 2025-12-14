import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

interface QueryWithTimeoutOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, "queryFn"> {
  queryFn: () => Promise<TData>;
  timeout?: number;
}

/**
 * Custom hook that wraps useQuery with a timeout mechanism
 * Automatically rejects queries that take longer than the specified timeout
 */
export function useQueryWithTimeout<TData = unknown, TError = Error>({
  queryFn,
  timeout = DEFAULT_TIMEOUT,
  ...options
}: QueryWithTimeoutOptions<TData, TError>): UseQueryResult<TData, TError> {
  const wrappedQueryFn = async (): Promise<TData> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Request timed out after ${timeout / 1000} seconds`));
          });
        })
      ]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return useQuery({
    ...options,
    queryFn: wrappedQueryFn,
    retry: (failureCount, error) => {
      // Don't retry on timeout errors - user should manually retry
      if (error instanceof Error && error.message.includes("timed out")) {
        return false;
      }
      // Default retry logic (up to 3 times)
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
