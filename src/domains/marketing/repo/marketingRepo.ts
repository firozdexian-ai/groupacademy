/**
 * Marketing domain repository (Phase 10i.3).
 *
 * Wraps raw supabase.from(...) calls for the Marketing admin area:
 * - Master marketing graph (channels, community groups, outreach, banners, themes, codes)
 * - Banner & content/outreach helpers
 * - Lead hunter sessions + matches + outreach
 * - Salary/Mock-interview access code generators
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Generic helpers ───────────────────────────────────────────────────────
export async function upsertGraphRow(table: string, payload: any): Promise<void> {
  if (payload?.id) {
    const { id, ...patch } = payload;
    const { error } = await supabase.from(table as any).update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table as any).insert(payload);
    if (error) throw error;
  }
}

export async function deleteGraphRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}

// ─── Marketing master graph ───────────────────────────────────────────────
export async function getMarketingGraphMaster() {
  const [channelsRes, groupsRes, talentOutreachRes, companyOutreachRes, bannersRes, themesRes, codesRes] =
    await Promise.all([
      supabase
        .from("mkt_channels")
        .select("id, name, type, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("mkt_community_groups")
        .select("id, name, platform, member_count, link, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("talent_outreach_log")
        .select("id, talent_id, channel, sent_at")
        .order("sent_at", { ascending: false })
        .limit(500),
      supabase
        .from("company_outreach_log")
        .select("id, company_id, contact_id, channel, sent_at")
        .order("sent_at", { ascending: false })
        .limit(500),
      supabase
        .from("banners")
        .select("id, placement, image_url, link_url, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("profile_card_themes")
        .select(
          "id, name, priority, media_type, gradient_css, media_url, poster_url, overlay_opacity, text_color, start_at, end_at, is_active, created_at",
        )
        .order("priority", { ascending: false })
        .limit(50),
      supabase
        .from("access_codes")
        .select("id, code, content_id, max_uses, current_uses, expires_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
  if (channelsRes.error) throw channelsRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (talentOutreachRes.error) throw talentOutreachRes.error;
  if (companyOutreachRes.error) throw companyOutreachRes.error;
  if (bannersRes.error) throw bannersRes.error;
  if (themesRes.error) throw themesRes.error;
  if (codesRes.error) throw codesRes.error;
  return {
    channels: channelsRes.data ?? [],
    communityGroups: groupsRes.data ?? [],
    talentOutreach: talentOutreachRes.data ?? [],
    companyOutreach: companyOutreachRes.data ?? [],
    banners: bannersRes.data ?? [],
    themes: themesRes.data ?? [],
    accessCodes: codesRes.data ?? [],
  };
}

// ─── Banners ────────────────────────────────────────────────────────────────
export async function listBannersWithContent(): Promise<any[]> {
  const { data, error } = await supabase
    .from("banners")
    .select(
      "id, image_url, link_content_id, display_order, is_active, placement, content:link_content_id (id, title)",
    )
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function listPublishedContentTitles(): Promise<Array<{ id: string; title: string }>> {
  const { data, error } = await supabase
    .from("content")
    .select("id, title")
    .eq("is_published", true)
    .order("title");
  if (error) throw error;
  return (data ?? []) as any;
}

export async function insertBanner(payload: Record<string, any>): Promise<void> {
  const { error } = await (supabase.from("banners") as any).insert([payload]);
  if (error) throw error;
}

export async function setBannerActive(bannerId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("banners").update({ is_active: isActive }).eq("id", bannerId);
  if (error) throw error;
}

export async function deleteBanner(bannerId: string): Promise<void> {
  const { error } = await supabase.from("banners").delete().eq("id", bannerId);
  if (error) throw error;
}

// ─── Content outreach ─────────────────────────────────────────────────────
export async function listPromotableContent(): Promise<any[]> {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const [recordedRes, liveRes] = await Promise.all([
    supabase
      .from("content")
      .select("id, title, slug, content_type, current_enrollment, is_published, description")
      .eq("is_published", true)
      .eq("is_ready", true)
      .eq("is_private", false)
      .eq("content_type", "recorded_course")
      .order("title"),
    supabase
      .from("content")
      .select("id, title, slug, content_type, current_enrollment, is_published, description")
      .eq("is_published", true)
      .eq("is_ready", true)
      .eq("is_private", false)
      .in("content_type", ["batch_class", "live_webinar"])
      .not("event_date", "is", null)
      .gte("event_date", cutoff)
      .order("event_date", { ascending: true }),
  ]);
  if (recordedRes.error) throw recordedRes.error;
  if (liveRes.error) throw liveRes.error;
  return [...(recordedRes.data ?? []), ...(liveRes.data ?? [])];
}

export async function listOutreachableTalents(): Promise<any[]> {
  const { data, error } = await supabase
    .from("talents")
    .select("id, full_name, email, phone, profession_category_id, country")
    .not("phone", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function listCourseOutreachRecords(courseId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("outreach_messages")
    .select("talent_id, course_id")
    .eq("product", "course")
    .eq("course_id", courseId);
  if (error) throw error;
  return data ?? [];
}

export async function logCourseOutreach(input: {
  talentId: string;
  courseId: string;
  messageContent: string;
}): Promise<void> {
  const { error } = await (supabase.from("outreach_messages") as any).insert({
    talent_id: input.talentId,
    product: "course",
    course_id: input.courseId,
    message_content: input.messageContent,
  });
  if (error) throw error;
}

export async function listContentShareLogs(contentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("content_share_logs")
    .select("channel, shared_at")
    .eq("content_id", contentId);
  if (error) throw error;
  return data ?? [];
}

export async function insertContentShareLog(input: { contentId: string; channel: string }): Promise<void> {
  const { error } = await (supabase.from("content_share_logs") as any).insert({
    content_id: input.contentId,
    channel: input.channel,
    shared_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─── Lead hunter ──────────────────────────────────────────────────────────
export async function listLeadHuntSessionsAndJobs(): Promise<{ sessions: any[]; jobs: any[] }> {
  const [sessionsRes, jobsRes] = await Promise.all([
    supabase.from("lead_hunt_sessions").select("*").order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, title, company_name, description")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (sessionsRes.error) throw sessionsRes.error;
  return { sessions: sessionsRes.data ?? [], jobs: jobsRes.data ?? [] };
}

export async function listLeadHuntMatches(sessionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("lead_hunt_matches")
    .select(
      "id, ai_match_score, ai_explanation, shortlisted, talent:talents ( id, full_name, email, phone, country, cv_url )",
    )
    .eq("session_id", sessionId)
    .order("ai_match_score", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function logTalentWelcomeOutreach(input: {
  talentId: string;
  channel: "whatsapp" | "email" | "linkedin";
}): Promise<void> {
  const { error } = await (supabase.from("outreach_messages") as any).insert({
    talent_id: input.talentId,
    product: "welcome",
    channel: input.channel,
  });
  if (error) throw error;
}

// ─── Access codes (mock interview / salary) ───────────────────────────────
export async function insertMockInterviewAccessCode(input: {
  code: string;
  email: string;
  createdBy?: string;
  expiresAt: string;
}): Promise<{ error: any }> {
  const { error } = await (supabase.from("mock_interview_access_codes") as any).insert({
    code: input.code,
    email: input.email,
    created_by: input.createdBy,
    expires_at: input.expiresAt,
  });
  return { error };
}

export async function insertSalaryAnalysisAccessCode(input: {
  code: string;
  email: string;
  createdBy?: string;
  expiresAt: string;
}): Promise<{ error: any }> {
  const { error } = await (supabase.from("salary_analysis_access_codes") as any).insert({
    code: input.code,
    email: input.email,
    created_by: input.createdBy,
    expires_at: input.expiresAt,
  });
  return { error };
}

// ─── Mock interview leads ─────────────────────────────────────────────────
export async function listMockInterviewLeads(): Promise<any[]> {
  const { data, error } = await supabase
    .from("mock_interviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Phase 10j.3: lead capture ---------------- */

export async function insertCareerAssessment(payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("career_assessments").insert(payload as any);
  if (error) throw error;
}
