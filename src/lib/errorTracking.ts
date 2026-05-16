/**
 * Centralized error tracking utility
 * Provides consistent error logging and real-time platform event reporting.
 *
 * Version: Launch Candidate · Phase Z0 Hardened
 */

import { supabase } from "@/integrations/supabase/client";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  talentId?: string;
  bannerId?: string;
  [key: string]: unknown;
}

function logPlatformEvent(
  eventKind: string,
  severity: "critical" | "warning" | "info",
  context: ErrorContext | undefined,
  payload: Record<string, unknown>,
): void {
  supabase
    .from("platform_events")
    .insert([
      {
        event_kind: eventKind,
        subject_kind: context?.component || "unknown",
        subject_id: context?.userId || null,
        payload: { severity, action: context?.action || "unknown", ...payload, ...context },
      },
    ])
    .then(({ error: dbErr }) => {
      if (dbErr) console.warn("[ErrorTracking] Failed to write platform event:", dbErr.message);
    });
}

/**
 * Track an error with context
 */
export function trackError(error: Error | string, context?: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  const timestamp = new Date().toISOString();

  console.error("[ErrorTracking]", { message: errorMessage, stack: errorStack, context, timestamp });

  logPlatformEvent("system_error", "critical", context, { message: errorMessage, stack: errorStack });
}

/**
 * Track a warning (non-critical issue)
 */
export function trackWarning(message: string, context?: ErrorContext): void {
  console.warn("[Warning]", { message, context, timestamp: new Date().toISOString() });
  logPlatformEvent("system_warning", "warning", context, { message });
}

/**
 * Track an important event for debugging and real-time platform signals
 */
export function trackEvent(event: string, data?: Record<string, unknown>): void {
  console.log("[Event]", { event, data, timestamp: new Date().toISOString() });
  logPlatformEvent("business_event", "info", { component: "tracker", action: event }, data || {});
}

/**
 * Create a scoped tracker for a specific component
 */
export function createTracker(component: string) {
  return {
    error: (error: Error | string, context?: Omit<ErrorContext, "component">) =>
      trackError(error, { ...context, component }),
    warning: (message: string, context?: Omit<ErrorContext, "component">) =>
      trackWarning(message, { ...context, component }),
    event: (event: string, data?: Record<string, unknown>) => trackEvent(`${component}:${event}`, data),
  };
}
