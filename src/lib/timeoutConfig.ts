/**
 * Centralized timeout configuration for all async operations
 * Adjust these values to control how long operations wait before failing
 */
export const TIMEOUTS = {
  /** Default timeout for most operations (30 seconds) */
  DEFAULT: 30000,

  /** Cold-start / first-request after idle (45 seconds) */
  COLD_START: 45000,

  /** Authentication/session checks (20 seconds - increased for slow networks) */
  AUTH: 20000,

  /** PWA/mobile auth - needs extra time for service worker init (25 seconds) */
  PWA_AUTH: 25000,

  /** Quick checks like email validation (10 seconds) */
  QUICK_CHECK: 10000,

  /** File uploads (90 seconds) */
  FILE_UPLOAD: 90000,

  /** AI generation/parsing operations (90 seconds) */
  AI_GENERATION: 90000,

  /** Category/dropdown data loading (30 seconds) */
  CATEGORY_LOAD: 30000,
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
