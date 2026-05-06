import { supabase } from "@/integrations/supabase/client";

/**
 * Onboarding + Career Coach telemetry. Fire-and-forget into platform_events.
 * Admin-readable via existing RLS. No client-side gating — never block the UI.
 */

export type OnboardingAction = "view" | "next" | "skip" | "complete" | "error";
export type CoachAction = "opened" | "first_message" | "session_resume";

async function emit(event_kind: string, subject_id: string | null | undefined, payload: Record<string, unknown>) {
  try {
    await supabase.from("platform_events").insert({
      event_kind,
      subject_kind: "talent",
      subject_id: subject_id ?? null,
      payload,
    } as any);
  } catch (e) {
    // Telemetry must never throw.
    console.debug("[telemetry insert failed]", event_kind, e);
  }
}

export function trackOnboardingStep(
  stepId: string,
  action: OnboardingAction,
  meta?: Record<string, unknown> & { talentId?: string },
) {
  if (typeof window === "undefined") return;
  const { talentId, ...rest } = meta ?? {};
  console.debug("[onboarding]", stepId, action, rest);
  void emit("onboarding_step", talentId, { stepId, action, ...rest });
}

export function trackCoachEvent(
  action: CoachAction,
  meta?: Record<string, unknown> & { talentId?: string },
) {
  if (typeof window === "undefined") return;
  const { talentId, ...rest } = meta ?? {};
  console.debug("[career-coach]", action, rest);
  void emit("career_coach", talentId, { action, ...rest });
}

export function trackOnboardingSkipped(stepId: string, talentId?: string) {
  void emit("onboarding_skipped", talentId, { stepId });
}

export function trackDuplicateDetected(talentId: string, fingerprint?: string | null) {
  void emit("duplicate_cv_detected", talentId, { fingerprint: fingerprint ?? null });
}
