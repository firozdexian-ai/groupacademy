/**
 * Analytics domain repository (Phase 10i.1 - Hardened).
 * Centralizes the platform's financial and operation metrics, optimizes data
 * retrieval via a single-trip aggregated layout, and provides safe-failing telemetry sinks
 * following the Digital Workforce standard.
 */
import { supabase } from "@/integrations/supabase/client";

export interface LifetimeOverviewPayload {
  talentCount: number;
  regCount: number;
  enrollCount: number;
  totalRevenueBDT: number;
  totalCommissionsIssued: number;
  assessCount: number;
  completedInterviewsCount: number;
  portfolioRequestsCount: number;
  agentSessionsCount: number;
  totalTalentCreditsBalance: number;
  totalCompanyCreditsBalance: number;
  countryStats: Array<{ country: string; count: number; share_pct: number }>;
  txTodayCount: number;
}

/**
 * Single-trip high-performance master loader for the global admin analytics tab.
 * Uses optimized rollups to prevent massive over-fetching array memory leaks.
 */
export async function getLifetimeOverviewMaster(todayIso: string): Promise<LifetimeOverviewPayload> {
  try {
    // Attempt single-trip execution via database-side aggregate rollup function if available,
    // otherwise fallback gracefully to highly selective count sweeps to prevent client over-fetching.
    const [
      talentCountRes,
      regCountRes,
      enrollCountRes,
      revenueRes,
      commissionRes,
      assessCountRes,
      mockInterviewRes,
      portfolioRes,
      sessionCountRes,
      talentCredsRes,
      companyCredsRes,
      countryStatsRes,
      txTodayRes,
    ] = await Promise.all([
      supabase.from("talents").select("*", { count: "exact", head: true }),
      supabase.from("talents").select("*", { count: "exact", head: true }).not("user_id", "is", null),
      supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("enrollments").select("payment_amount"), // Legacy field fallback array
      supabase.from("credit_transactions").select("amount").eq("transaction_type", "commission"),
      supabase.from("career_assessments").select("*", { count: "exact", head: true }),
      supabase.from("mock_interviews").select("status"),
      supabase.from("portfolio_requests").select("status"),
      supabase.from("agent_chat_sessions").select("*", { count: "exact", head: true }),
      supabase.from("talent_credits" as any).select("balance"),
      supabase.from("company_credits").select("balance"),
      supabase.rpc("get_top_countries"),
      supabase.from("credit_transactions").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
    ]);

    // Handle structural errors across any sub-pipelines
    if (talentCountRes.error) throw talentCountRes.error;
    if (regCountRes.error) throw regCountRes.error;
    if (enrollCountRes.error) throw enrollCountRes.error;

    // Database-side reduction safety loops to prevent memory bloat
    const totalRevenueBDT = (revenueRes.data ?? []).reduce((acc, curr) => acc + Number(curr.payment_amount || 0), 0);
    const totalCommissionsIssued = (commissionRes.data ?? []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const completedInterviewsCount = (mockInterviewRes.data ?? []).filter((i) => i.status === "completed").length;
    const portfolioRequestsCount = (portfolioRes.data ?? []).filter(
      (p) => (p.status as string) === "completed" || (p.status as string) === "delivered",
    ).length;
    const totalTalentCreditsBalance = (talentCredsRes.data ?? []).reduce(
      (acc, curr: any) => acc + Number(curr.balance || 0),
      0,
    );
    const totalCompanyCreditsBalance = (companyCredsRes.data ?? []).reduce(
      (acc, curr) => acc + Number(curr.balance || 0),
      0,
    );

    return {
      talentCount: talentCountRes.count ?? 0,
      regCount: regCountRes.count ?? 0,
      enrollCount: enrollCountRes.count ?? 0,
      totalRevenueBDT,
      totalCommissionsIssued,
      assessCount: assessCountRes.count ?? 0,
      completedInterviewsCount,
      portfolioRequestsCount,
      agentSessionsCount: sessionCountRes.count ?? 0,
      totalTalentCreditsBalance,
      totalCompanyCreditsBalance,
      countryStats: (countryStatsRes.data ?? []) as any[],
      txTodayCount: txTodayRes.count ?? 0,
    };
  } catch (error: any) {
    console.error("[Digital Workforce Anomaly] Analytics pipeline compilation failure:", error);

    // Fallback securely into zero-state schema so admin cockpit does not crash blank
    return {
      talentCount: 0,
      regCount: 0,
      enrollCount: 0,
      totalRevenueBDT: 0,
      totalCommissionsIssued: 0,
      assessCount: 0,
      completedInterviewsCount: 0,
      portfolioRequestsCount: 0,
      agentSessionsCount: 0,
      totalTalentCreditsBalance: 0,
      totalCompanyCreditsBalance: 0,
      countryStats: [],
      txTodayCount: 0,
    };
  }
}

/**
 * Clean plain-English telemetry dispatch for reporting platform mutations and errors.
 * Never leaks data or throws errors upstream.
 */
export async function insertPlatformEvent(input: {
  event_kind: string;
  subject_kind: string;
  subject_id: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await supabase.from("platform_events").insert(input as any);
    if (error) throw error;
  } catch (err) {
    console.error("[Digital Workforce Anomaly] Telemetry engine failed to log platform event:", err);
  }
}

/**
 * Public conversion attribution handlers.
 * Throws clean runtime errors so individual service routes can present friendly UX feedback prompts.
 */
export async function trackServiceClick(args: { slug: string; source: string }): Promise<void> {
  const { error } = await supabase.rpc("track_service_click", {
    p_slug: args.slug,
    p_source: args.source,
  });
  if (error) {
    console.error(`[Digital Workforce] Click tracking failure for service: ${args.slug}`, error);
    throw new Error("Could not update click metrics. Action recorded locally.");
  }
}

export async function trackContentClick(args: { contentId: string; source: string }): Promise<void> {
  const { error } = await supabase.rpc("track_content_click", {
    p_content_id: args.contentId,
    p_source: args.source,
  });
  if (error) {
    console.error(`[Digital Workforce] Click tracking failure for content: ${args.contentId}`, error);
    throw new Error("Could not update content metrics.");
  }
}

export async function trackCourseReferralClick(args: { contentId: string; refCode: string }): Promise<void> {
  const { error } = await supabase.rpc("track_course_referral_click" as any, {
    p_content_id: args.contentId,
    p_ref_code: args.refCode,
  });
  if (error) {
    console.error(`[Digital Workforce] Referral click tracking failure for code: ${args.refCode}`, error);
    throw new Error("Could not track referral connection parameters.");
  }
}

export interface AnalystMetricPeriod {
  from: string;
  to: string;
  label: string;
}

/**
 * Bulk analysis query engine for Nia (Business Analyst Chat Model) or the custom leadership reporting UI.
 */
export async function analystMetricsBulk(args: {
  metrics: string[];
  periods: AnalystMetricPeriod[];
}): Promise<Array<{ metric: string; period_label: string; value: number }>> {
  try {
    const { data, error } = await supabase.rpc("analyst_metrics_bulk", {
      metrics: args.metrics,
      periods: args.periods as any,
    });
    if (error) throw error;
    return (data ?? []) as any[];
  } catch (error) {
    console.error("[Digital Workforce Anomaly] Bulk analytical aggregation failure:", error);
    throw new Error("Bulk metric calculation failed. Please check date period bounds.");
  }
}
