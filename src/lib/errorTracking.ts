/**
 * Centralized error tracking utility
 * Provides consistent error logging, real-time platform event reporting,
 * and automated agent escalation to the Admin Dashboard Command Center.
 *
 * Version: Launch Candidate · Phase Z0 Hardened
 */

import { supabase } from "@/integrations/supabase/client";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  talentId?: string;
  bannerId?: string; // Appended for Phase Z0 banner tracking anomalies
  [key: string]: unknown;
}

/**
 * Track an error with context and escalate anomalies directly to the Admin Swarm
 */
export function trackError(error: Error | string, context?: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  const timestamp = new Date().toISOString();

  // 1. Maintain local standard debugging stream
  console.error("[ErrorTracking]", {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp,
  });

  // 2. Automated Efficiency: Fire-and-forget asynchronous persistence to the platform log firehose
  supabase
    .from("platform_events")
    .insert([
      {
        event_type: "system_error",
        severity: "critical",
        component: context?.component || "unknown",
        action: context?.action || "unknown",
        user_id: context?.userId || null,
        metadata: {
          message: errorMessage,
          stack: errorStack,
          ...context,
        },
      },
    ])
    .then(({ error: dbErr }) => {
      if (dbErr) console.warn("[ErrorTracking] Failed to multiplex error to platform_events:", dbErr.message);
    });

  // 3. Digital Workforce Escalation: Route UI/Media/Asset broken stubs to Admin Chat
  const isMediaAnomaly =
    errorMessage.toLowerCase().includes("load") || errorMessage.toLowerCase().includes("bucket") || context?.bannerId;

  if (isMediaAnomaly) {
    // Post directly to the agent runtime messaging system to trigger an operator intervention notification
    supabase
      .from("admin_chat_messages")
      .insert([
        {
          sender_type: "system_agent",
          agent_key: "agent-manager", // Dispatches directly to the Agent OS Manager persona
          message_text: `🚨 **Technical Anomaly Alert** 🚨\n\n**Component:** ${context?.component || "Unknown"}\n**Action:** ${context?.action || "Unknown"}\n**Error:** ${errorMessage}\n\n*Immediate infrastructure verification or asset-bucket check required.*`,
          metadata: { context, timestamp },
        },
      ])
      .then(({ error: agentErr }) => {
        if (agentErr) console.warn("[ErrorTracking] Failed to notify Admin Command Center:", agentErr.message);
      });
  }
}

/**
 * Track a warning (non-critical issue)
 */
export function trackWarning(message: string, context?: ErrorContext): void {
  console.warn("[Warning]", {
    message,
    context,
    timestamp: new Date().toISOString(),
  });

  // Log non-blocking warnings to the tracking database for diagnostic audits
  supabase
    .from("platform_events")
    .insert([
      {
        event_type: "system_warning",
        severity: "warning",
        component: context?.component || "unknown",
        action: context?.action || "unknown",
        user_id: context?.userId || null,
        metadata: { message, ...context },
      },
    ])
    .then(({ error: dbErr }) => {
      if (dbErr) console.warn("[ErrorTracking] Failed to write warning event:", dbErr.message);
    });
}

/**
 * Track an important event for debugging and real-time platform signals
 */
export function trackEvent(event: string, data?: Record<string, unknown>): void {
  console.log("[Event]", {
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  // Sync real-time discovery tracking signals to ensure the For-You metrics match live use
  supabase
    .from("platform_events")
    .insert([
      {
        event_type: "business_event",
        severity: "info",
        component: "tracker",
        action: event,
        metadata: data || {},
      },
    ])
    .then(({ error: dbErr }) => {
      if (dbErr) console.warn("[ErrorTracking] Failed to preserve platform tracking metric:", dbErr.message);
    });
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
