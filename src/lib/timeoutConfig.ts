/**
 * Centralized timeout configuration for all async operations
 * Adjust these values to control how long operations wait before failing
 */
export const TIMEOUTS = {
  /** Default timeout for most operations (15 seconds) */
  DEFAULT: 15000,
  
  /** Authentication/session checks (10 seconds) */
  AUTH: 10000,
  
  /** Quick checks like email validation (5 seconds) */
  QUICK_CHECK: 5000,
  
  /** File uploads (60 seconds) */
  FILE_UPLOAD: 60000,
  
  /** AI generation/parsing operations (60 seconds) */
  AI_GENERATION: 60000,
  
  /** Category/dropdown data loading (10 seconds) */
  CATEGORY_LOAD: 10000,
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
