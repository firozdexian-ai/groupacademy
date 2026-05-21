/**
 * Jobs domain repository.
 *
 * Phase 10a: typed wrappers around `supabase.from(...)` for jobs-owned tables
 * (jobs, job_applications, job_invitations, application_messages, ...).
 *
 * Rules:
 * - Named-export functions only; no React, no hooks here.
 * - Throws on error; callers use try/catch like edge wrappers.
 * - This is the ONLY place outside repos that may call `supabase.from`
 *   on jobs-owned tables (the ESLint guard enforces this).
 */
import { supabase } from "@/integrations/supabase/client";

export interface ApplicationMessageRow {
  id: string;
  application_id: string;
  sender_id: string;
  sender_role: "talent" | "recruiter" | "admin";
  body: string;
  attachments: unknown;
  read_at: string | null;
  created_at: string;
}

export async function listApplicationMessages(
  applicationId: string,
): Promise<ApplicationMessageRow[]> {
  const { data, error } = await supabase
    .from("application_messages")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ApplicationMessageRow[];
}

export async function insertApplicationMessage(input: {
  applicationId: string;
  senderId: string;
  senderRole: "talent" | "recruiter" | "admin";
  body: string;
}): Promise<void> {
  const { error } = await supabase.from("application_messages").insert({
    application_id: input.applicationId,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    body: input.body,
  });
  if (error) throw error;
}

export async function markApplicationMessagesRead(input: {
  applicationId: string;
  currentUserId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("application_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("application_id", input.applicationId)
    .neq("sender_id", input.currentUserId)
    .is("read_at", null);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Job sharing helpers (used by gigs/JobSharing flow)
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveJobsForSharing() {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company_name, location")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getJobShareClickCounts(
  talentId: string,
  jobIds: string[],
): Promise<Record<string, number>> {
  if (jobIds.length === 0) return {};
  const { data, error } = await supabase
    .from("job_share_clicks")
    .select("job_id")
    .eq("talent_id", talentId)
    .in("job_id", jobIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: any) => {
    if (row?.job_id) counts[row.job_id] = (counts[row.job_id] || 0) + 1;
  });
  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Access codes (assessment + job application)
// ─────────────────────────────────────────────────────────────────────────────

export async function insertAssessmentAccessCode(payload: {
  code: string;
  email: string;
  created_by?: string | null;
  expires_at?: string;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("assessment_access_codes").insert(payload as any);
  return { error };
}

export async function insertJobApplicationAccessCode(payload: {
  code: string;
  email: string;
  created_by?: string | null;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("job_application_access_codes").insert(payload as any);
  return { error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Jobs CRUD (admin)
// ─────────────────────────────────────────────────────────────────────────────

export type AdminJobsStatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "featured"
  | "stale"
  | "expired";

export interface ListAdminJobsOpts {
  columns?: string;
  search?: string;
  status?: AdminJobsStatusFilter;
  page?: number;
  pageSize?: number;
}

import { sanitizeIlike } from "@/lib/supabaseQuery";

export async function listAdminJobs(opts: ListAdminJobsOpts = {}): Promise<{
  rows: any[];
  count: number;
}> {
  const { columns = "*", search, status = "all", page = 1, pageSize = 10 } = opts;
  let query = supabase
    .from("jobs")
    .select(columns, { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    const safe = sanitizeIlike(search);
    query = query.or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`);
  }

  if (status === "active") query = query.eq("is_active", true);
  else if (status === "inactive") query = query.eq("is_active", false);
  else if (status === "featured") query = query.eq("is_featured", true);
  else if (status === "stale") {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt("created_at", sixtyDaysAgo);
  } else if (status === "expired") {
    query = query.not("deadline", "is", null).lt("deadline", new Date().toISOString());
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as any[], count: count ?? 0 };
}

export async function listPendingApprovalJobs(): Promise<any[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id,title,company_name,location,is_active,is_featured,created_at")
    .eq("is_active", false)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getJobById(id: string): Promise<any | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function insertJob(payload: any): Promise<void> {
  const { error } = await supabase.from("jobs").insert(payload);
  if (error) throw error;
}

export async function insertJobsBulk(payloads: any[]): Promise<void> {
  const { error } = await supabase.from("jobs").insert(payloads as any);
  if (error) throw error;
}

export async function updateJob(id: string, patch: any): Promise<void> {
  const { error } = await supabase.from("jobs").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateJobsBulk(ids: string[], patch: any): Promise<void> {
  const { error } = await supabase.from("jobs").update(patch).in("id", ids);
  if (error) throw error;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteJobsBulk(ids: string[]): Promise<void> {
  const { error } = await supabase.from("jobs").delete().in("id", ids);
  if (error) throw error;
}

export interface JobEngagementCounts {
  clicks: number;
  saves: number;
  recommendations: number;
}

export async function getJobEngagementCounts(
  jobIds: string[],
): Promise<Record<string, JobEngagementCounts>> {
  const stats: Record<string, JobEngagementCounts> = {};
  if (!jobIds.length) return stats;
  jobIds.forEach((id) => (stats[id] = { clicks: 0, saves: 0, recommendations: 0 }));
  const [clicksRes, savesRes, recsRes] = await Promise.all([
    supabase.from("job_analytics").select("job_id").in("job_id", jobIds),
    (supabase.from("saved_items") as any)
      .select("item_id")
      .eq("kind", "job")
      .in("item_id", jobIds),
    supabase.from("ai_job_recommendations").select("job_id").in("job_id", jobIds),
  ]);
  ((clicksRes.data ?? []) as Array<{ job_id: string }>).forEach((c) => {
    if (stats[c.job_id]) stats[c.job_id].clicks++;
  });
  ((savesRes.data ?? []) as Array<{ item_id: string }>).forEach((s) => {
    if (stats[s.item_id]) stats[s.item_id].saves++;
  });
  ((recsRes.data ?? []) as Array<{ job_id: string }>).forEach((r) => {
    if (stats[r.job_id]) stats[r.job_id].recommendations++;
  });
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Applications (admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function listActiveJobsLite(
  limit = 500,
): Promise<Array<{ id: string; title: string; company_name: string }>> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id,title,company_name")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any;
}

export async function findJobIdsBySearch(search: string, limit = 200): Promise<string[]> {
  const safe = sanitizeIlike(search);
  if (!safe) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("id")
    .or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((j: any) => j.id);
}

export interface SearchAdminApplicationsOpts {
  statusFilter?: string;
  sourceFilter?: string;
  jobFilter?: string;
  scoreFilter?: string;
  sortByScore?: boolean;
  page: number;
  pageSize: number;
  talentIds?: string[];
  jobIds?: string[];
  searchActive?: boolean;
}

export async function searchAdminApplications(
  opts: SearchAdminApplicationsOpts,
): Promise<{ rows: any[]; count: number }> {
  const {
    statusFilter = "all",
    sourceFilter = "all",
    jobFilter = "all",
    scoreFilter = "all",
    sortByScore,
    page,
    pageSize,
    talentIds,
    jobIds,
    searchActive,
  } = opts;

  let query = supabase.from("job_applications").select(
    `id, job_id, talent_id, application_status, delivery_status, created_at, cv_url, source, ai_match_score, ai_match_rationale, external_notes,
       jobs (title, company_name),
       talents (full_name, email, phone)`,
    { count: "exact" },
  );

  if (statusFilter !== "all") query = query.eq("application_status", statusFilter as any);
  if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
  if (jobFilter !== "all") query = query.eq("job_id", jobFilter);

  if (scoreFilter === "scored") query = query.not("ai_match_score", "is", null);
  else if (scoreFilter === "unscored") query = query.is("ai_match_score", null);
  else if (scoreFilter === "strong") query = query.gte("ai_match_score", 80);
  else if (scoreFilter === "weak") query = query.lt("ai_match_score", 40);

  if (searchActive) {
    const orParts: string[] = [];
    if (talentIds?.length) orParts.push(`talent_id.in.(${talentIds.join(",")})`);
    if (jobIds?.length) orParts.push(`job_id.in.(${jobIds.join(",")})`);
    if (orParts.length) query = query.or(orParts.join(","));
    else return { rows: [], count: 0 };
  }

  if (sortByScore) query = query.order("ai_match_score", { ascending: false, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as any[], count: count ?? 0 };
}

export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("job_applications")
    .update({ application_status: status as any })
    .eq("id", id);
  if (error) throw error;
}

export async function insertExternalJobApplication(payload: {
  job_id: string;
  talent_id: string;
  cv_url: string | null;
  cover_letter: string | null;
  external_notes: string | null;
  added_by: string | null;
}): Promise<void> {
  const { error } = await supabase.from("job_applications").insert({
    ...payload,
    application_status: "submitted",
    delivery_status: "pending",
    is_paid: true,
    source: "external",
  } as any);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel promotion
// ─────────────────────────────────────────────────────────────────────────────

export async function listJobChannelPosts(jobId: string): Promise<Array<{ channel: string }>> {
  const { data, error } = await supabase
    .from("job_channel_posts")
    .select("channel")
    .eq("job_id", jobId);
  if (error) throw error;
  return (data ?? []) as any;
}

export async function insertJobChannelPost(payload: {
  job_id: string;
  channel: string;
  posted_by: string | null;
  caption: string | null;
}): Promise<void> {
  const { error } = await supabase.from("job_channel_posts").insert(payload as any);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Active job locations (talent JobPreferencesSheet)
// ─────────────────────────────────────────────────────────────────────────────

export async function listActiveJobLocations(limit = 300): Promise<string[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("location")
    .eq("is_active", true)
    .limit(limit);
  if (error) throw error;
  const locSet = new Set<string>(["Remote"]);
  (data ?? []).forEach((j: any) => {
    if (j.location) locSet.add(String(j.location).trim());
  });
  return Array.from(locSet).slice(0, 15);
}

// ─────────────────────────────────────────────────────────────────────────────
// Jobs ATS graph (used by useJobsGraph)
// ─────────────────────────────────────────────────────────────────────────────

export async function getJobsGraphMaster() {
  const [jobsRes, appsRes, crmRes, assessRes, inviteRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, company_id, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("job_applications")
      .select("id, job_id, talent_id, status:application_status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("talent_relationships")
      .select("id, talent_id, company_id, stage, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("job_assessments")
      .select("id, job_id, talent_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("job_invitations")
      .select("id, job_id, talent_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (jobsRes.error) throw jobsRes.error;
  if (appsRes.error) throw appsRes.error;
  if (crmRes.error) throw crmRes.error;
  if (assessRes.error) throw assessRes.error;
  if (inviteRes.error) throw inviteRes.error;
  return {
    jobsRaw: jobsRes.data ?? [],
    applications: appsRes.data ?? [],
    crmRecords: crmRes.data ?? [],
    assessments: assessRes.data ?? [],
    invitations: inviteRes.data ?? [],
  };
}

export async function upsertGraphRow(table: string, payload: any): Promise<void> {
  if (payload?.id) {
    const { error } = await supabase.from(table as any).update(payload).eq("id", payload.id);
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

export async function updateJobApplication(id: string, patch: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("job_applications").update(patch).eq("id", id);
  if (error) throw error;
}

// ─── Phase 10j.2 — tool_runs / offers / interviews ────────────────────────
export async function listToolRunsForUser(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from("tool_runs")
    .select("id, tool_key, cost_credits, payload, job_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function insertToolRun(payload: {
  user_id: string;
  tool_key: string;
  cost_credits: number;
  payload?: Record<string, any>;
  job_id?: string | null;
}) {
  const { error } = await supabase.from("tool_runs").insert({
    user_id: payload.user_id,
    tool_key: payload.tool_key,
    cost_credits: payload.cost_credits,
    payload: payload.payload ?? {},
    job_id: payload.job_id ?? null,
  });
  if (error) throw error;
}

export async function insertOffer(payload: Record<string, any>): Promise<string> {
  const { data, error } = await (supabase.from("offers") as any)
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateOfferStatus(offerId: string, status: string): Promise<void> {
  const { error } = await supabase.from("offers").update({ status: status as any }).eq("id", offerId);
  if (error) throw error;
}

export async function insertInterview(payload: Record<string, any>): Promise<string> {
  const { data, error } = await (supabase.from("interviews") as any)
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function insertInterviewSlots(rows: Array<Record<string, any>>): Promise<void> {
  if (!rows.length) return;
  const { error } = await (supabase.from("interview_slots") as any).insert(rows);
  if (error) throw error;
}

// ─── Phase 10j.5d additions ────────────────────────────────────────────────
export async function getInterviewById(id: string) {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listInterviewSlots(interviewId: string) {
  const { data, error } = await supabase
    .from("interview_slots")
    .select("*")
    .eq("interview_id", interviewId)
    .order("starts_at");
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function listJobsByIdsBasic(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company_name, location")
    .in("id", ids);
  if (error) throw error;
  return (data as any[]) ?? [];
}

// ─── Phase 10j.5e: job assessment answers update ──────────────────────────
export async function updateJobAssessment(id: string, patch: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("job_assessments").update(patch).eq("id", id);
  if (error) throw error;
}

// ─── Phase 10j.6a: jobs/offers/interview RPC helpers ───────────────────────
export async function getRemoteFriendlySummary() {
  const { data, error } = await supabase.rpc("get_remote_friendly_summary");
  if (error) throw error;
  return data;
}

export async function getCountriesWithSignal(p_limit: number) {
  const { data, error } = await supabase.rpc("get_countries_with_signal", { p_limit });
  if (error) throw error;
  return data;
}

export async function getNextBestTool(p_user_id: string) {
  const { data, error } = await supabase.rpc("get_next_best_tool", { p_user_id });
  if (error) throw error;
  return data;
}

export async function acceptOffer(p_offer_id: string, p_signed_name: string): Promise<void> {
  const { error } = await supabase.rpc("accept_offer", { p_offer_id, p_signed_name });
  if (error) throw error;
}

export async function declineOffer(p_offer_id: string, p_note: string | null): Promise<void> {
  const { error } = await supabase.rpc("decline_offer", { p_offer_id, p_note });
  if (error) throw error;
}

export async function getApplicationHireState(p_application_id: string) {
  const { data, error } = await supabase.rpc("get_application_hire_state", { p_application_id });
  if (error) throw error;
  return data;
}

export async function confirmInterviewSlot(p_interview_id: string, p_slot_id: string): Promise<void> {
  const { error } = await supabase.rpc("confirm_interview_slot", { p_interview_id, p_slot_id });
  if (error) throw error;
}

export async function getEmployerJobsDashboard(p_company_id: string) {
  const { data, error } = await supabase.rpc("get_employer_jobs_dashboard", { p_company_id });
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Phase 10j.5g2: active jobs for a company ─────────────────────────────
export async function listActiveJobsByCompanyId(companyId: string, limit = 10): Promise<any[]> {
  const { data } = await supabase
    .from("jobs")
    .select("id, title, location, job_type, is_active, created_at")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as any[];
}

export async function listActiveJobsByCompanyIdShort(companyId: string, limit = 10): Promise<any[]> {
  const { data } = await supabase
    .from("jobs")
    .select("id, title, location, job_type")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as any[];
}

// ─── Phase 10j.5g2: AppJobApplication helpers ─────────────────────────────
export async function getJobForApplication(jobId: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company_name, company_logo_url, application_email, ai_assessment_enabled")
    .eq("id", jobId)
    .single();
  return { data, error };
}

export async function getExistingTalentApplication(
  jobId: string,
  talentId: string,
): Promise<any | null> {
  const { data } = await supabase
    .from("job_applications")
    .select(`id, job_assessments(id)`)
    .eq("job_id", jobId)
    .eq("talent_id", talentId)
    .maybeSingle();
  return data ?? null;
}

export async function insertTalentJobApplication(payload: {
  job_id: string;
  talent_id: string;
  cover_letter: string;
  cv_url: string | null;
  delivery_status?: string;
}): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from("job_applications")
    .insert({ ...payload, delivery_status: payload.delivery_status ?? "pending" } as any)
    .select("id")
    .single();
  return { data, error };
}

// ─── Phase 10j.5g3 ─────────────────────────────────────────────────────────
export async function listTalentApplicationsWithJob(talentId: string) {
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `
        id, job_id, application_status, created_at, last_status_at,
        job:jobs(title, company_name, company_logo_url, ai_assessment_enabled),
        job_assessments(id, status)
      `,
    )
    .eq("talent_id", talentId)
    .order("last_status_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}
