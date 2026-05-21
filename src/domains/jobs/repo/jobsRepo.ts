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
