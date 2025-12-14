import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const DEFAULT_TIMEOUT = 15000; // 15 seconds

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

/**
 * Generic hook for fetching data with timeout protection and error handling
 */
export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchOptions = {}
): UseDataFetchResult<T> {
  const { 
    timeout = DEFAULT_TIMEOUT, 
    showErrorToast = false,
    errorMessage = 'Failed to load data'
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsTimeout(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await Promise.race([
        fetchFn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error(`Request timed out after ${timeout / 1000} seconds`));
          });
        })
      ]);
      
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (error.message.includes('timed out')) {
        setIsTimeout(true);
        if (showErrorToast) {
          toast.error('Request timed out. Please try again.');
        }
      } else if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      console.error('Data fetch error:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [fetchFn, timeout, showErrorToast, errorMessage]);

  return { data, isLoading, error, isTimeout, refetch };
}

/**
 * Utility function to wrap any async function with a timeout
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
        controller.signal.addEventListener('abort', () => {
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
  return error instanceof Error && error.message.includes('timed out');
}
