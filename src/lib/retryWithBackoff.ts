export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries an async operation with exponential backoff.
 * Designed for transient network/cold-start delays.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 1000,
    maxDelayMs = 4000,
    shouldRetry = () => true,
  }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      if (!shouldRetry(err)) break;

      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
