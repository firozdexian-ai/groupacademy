/**
 * Analytics domain — barrel re-exporting typed edge wrappers (Phase 9g - Hardened).
 * Unifies all operational dashboard counters, automated reporting engines, and
 * analyst agent contracts into a clean, re-exported surface layer.
 */

// Core database substrate infrastructure loaders
export {
  getLifetimeOverviewMaster,
  insertPlatformEvent,
  trackServiceClick,
  trackContentClick,
  trackCourseReferralClick,
  analystMetricsBulk,
} from "./analyticsApi";

export type { LifetimeOverviewPayload, AnalystMetricPeriod } from "./analyticsApi";

// Agentic OS serverless function connection lines
export { adminReportBuilder, adminAnalystQuery } from "./analyticsApi";

export type { AnalyticsEdgeExecutionResult } from "./analyticsApi";

// Structural data schemas & contract specifications
export type {
  AdminReportBuilderRequest,
  AdminReportBuilderResponse,
  AdminAnalystRequest,
  AdminAnalystResponse,
} from "@/edge/contracts/analytics";
