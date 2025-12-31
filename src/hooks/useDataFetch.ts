import { useState, useCallback, useRef, useEffect } from 'react';
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
 * Generic hook for fetching data with real abort support and timeout protection
 */
export function useDataFetch<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsLoading(true);
    setError(null);
    setIsTimeout(false);

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await fetchFn(controller.signal);
      clearTimeout(timeoutId);
      
      // Only update state if this is still the active request
      if (abortControllerRef.current === controller) {
        setData(result);
        setError(null);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      // Ignore aborted requests (user navigated away or new request started)
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // Check if it was a timeout (our timeout triggered the abort)
        if (abortControllerRef.current === controller) {
          setIsTimeout(true);
          setError(new Error('Request timed out. Please try again.'));
          if (showErrorToast) {
            toast.error('Request timed out. Please try again.');
          }
        }
        return;
      }
      
      if (abortControllerRef.current === controller) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        
        console.error('Data fetch error:', errorObj);
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
 * Check if an error is a timeout/abort error
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    return error.name === 'AbortError' || 
           error.message.includes('timed out') ||
           error.message.includes('aborted');
  }
  return false;
}

/**
 * Utility function to wrap any async function with a timeout
 * Note: This creates a fake timeout - prefer using AbortSignal when possible
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
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
