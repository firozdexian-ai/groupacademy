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
