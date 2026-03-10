import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSupabaseQueryOptions<T> {
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
 * Hook for Supabase queries with proper AbortController support.
 * Unlike Promise.race, this actually cancels the request when timeout occurs.
 */
export function useSupabaseQuery<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  options: UseSupabaseQueryOptions<T> = {}
): UseSupabaseQueryResult<T> {
  const { timeout = 15000, onError, onTimeout } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    // Abort any existing request
    abort();
    
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    setIsTimeout(false);
    
    // Set up timeout
    timeoutIdRef.current = setTimeout(() => {
      controller.abort();
      setIsTimeout(true);
      setLoading(false);
      setError(new Error(`Request timed out after ${timeout / 1000} seconds`));
      onTimeout?.();
    }, timeout);
    
    try {
      const result = await queryFn(controller.signal);
      
      // Clear timeout on success
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Only update state if not aborted
      if (!controller.signal.aborted) {
        setData(result);
        setLoading(false);
        return result;
      }
    } catch (err) {
      // Clear timeout on error
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Handle abort separately
      if (err instanceof Error && err.name === 'AbortError') {
        if (!isTimeout) {
          setIsTimeout(true);
        }
        return null;
      }
      
      // Only update state if not aborted
      if (!controller.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setLoading(false);
        onError?.(error);
      }
    }
    
    return null;
  }, [queryFn, timeout, abort, onError, onTimeout, isTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abort();
  }, [abort]);

  return { data, loading, error, isTimeout, execute, abort };
}

/**
 * Execute a Supabase query with timeout and abort support.
 * Returns a promise that rejects on timeout and actually cancels the request.
 */
export async function executeWithAbort<T>(
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const result = await queryFn(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw err;
  }
}

/**
 * Check if an error is an abort/timeout error
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('timed out');
  }
  return false;
}
