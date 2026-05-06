/**
 * Lightweight onboarding telemetry. Phase 1.3 keeps this client-side
 * (console.debug only). Phase 1.5 will route to a `talent_funnel_events`
 * table.
 */

export type OnboardingAction = "view" | "next" | "skip" | "complete" | "error";

export function trackOnboardingStep(stepId: string, action: OnboardingAction, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line no-console
  console.debug("[onboarding]", stepId, action, meta ?? {});
}
