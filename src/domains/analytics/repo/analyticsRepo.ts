/**
 * Analytics domain repository (Phase 10i.1).
 */
import { supabase } from "@/integrations/supabase/client";

export async function getLifetimeOverviewMaster(todayIso: string) {
  const [
    talentCount,
    regCount,
    enrollCount,
    revRes,
    commRes,
    assessCount,
    intRes,
    portRes,
    sessionCount,
    talentCreds,
    companyCreds,
    countryStats,
    txTodayResult,
  ] = await Promise.all([
    supabase.from("talents").select("*", { count: "exact", head: true }),
    supabase
      .from("talents")
      .select("*", { count: "exact", head: true })
      .not("user_id", "is", null),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("enrollments").select("payment_amount"),
    supabase.from("credit_transactions").select("amount").eq("transaction_type", "commission"),
    supabase.from("career_assessments").select("*", { count: "exact", head: true }),
    supabase.from("mock_interviews").select("status"),
    supabase.from("portfolio_requests").select("status"),
    supabase.from("agent_chat_sessions").select("*", { count: "exact", head: true }),
    supabase.from("talent_credits").select("balance"),
    supabase.from("company_credits").select("balance"),
    supabase.rpc("get_top_countries" as any),
    supabase
      .from("credit_transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso),
  ]);
  return {
    talentCount,
    regCount,
    enrollCount,
    revRes,
    commRes,
    assessCount,
    intRes,
    portRes,
    sessionCount,
    talentCreds,
    companyCreds,
    countryStats,
    txTodayResult,
  };
}

// -----------------------------------------------------------------------------
// Phase 10j.1 — telemetry helper
// -----------------------------------------------------------------------------

/** Fire-and-forget telemetry insert into platform_events. Never throws. */
export async function insertPlatformEvent(input: {
  event_kind: string;
  subject_kind: string;
  subject_id: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  await supabase.from("platform_events").insert(input as any);
}

// -----------------------------------------------------------------------------
// Phase 10j.5h3 — public attribution trackers (fire-and-forget; throw on error
// so callers can decide whether to swallow).
// -----------------------------------------------------------------------------

export async function trackServiceClick(args: { slug: string; source: string }): Promise<void> {
  const { error } = await supabase.rpc("track_service_click", {
    p_slug: args.slug,
    p_source: args.source,
  });
  if (error) throw error;
}

export async function trackContentClick(args: { contentId: string; source: string }): Promise<void> {
  const { error } = await supabase.rpc("track_content_click", {
    p_content_id: args.contentId,
    p_source: args.source,
  });
  if (error) throw error;
}

export async function trackCourseReferralClick(args: { contentId: string; refCode: string }): Promise<void> {
  const { error } = await (supabase.rpc as any)("track_course_referral_click", {
    p_content_id: args.contentId,
    p_ref_code: args.refCode,
  });
  if (error) throw error;
}

