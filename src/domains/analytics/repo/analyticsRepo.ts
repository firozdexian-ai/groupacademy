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

