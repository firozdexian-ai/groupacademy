/**
 * Centralized error tracking utility
 * Provides consistent error logging and future analytics integration
 */

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  talentId?: string;
  [key: string]: unknown;
}

/**
 * Track an error with context
 */
export function trackError(error: Error | string, context?: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error('[ErrorTracking]', {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Future: Send to external monitoring service
}

/**
 * Track a warning (non-critical issue)
 */
export function trackWarning(message: string, context?: ErrorContext): void {
  console.warn('[Warning]', {
    message,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track an important event for debugging
 */
export function trackEvent(event: string, data?: Record<string, unknown>): void {
  console.log('[Event]', {
    event,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create a scoped tracker for a specific component
 */
export function createTracker(component: string) {
  return {
    error: (error: Error | string, context?: Omit<ErrorContext, 'component'>) => 
      trackError(error, { ...context, component }),
    warning: (message: string, context?: Omit<ErrorContext, 'component'>) => 
      trackWarning(message, { ...context, component }),
    event: (event: string, data?: Record<string, unknown>) => 
      trackEvent(`${component}:${event}`, data),
  };
}
