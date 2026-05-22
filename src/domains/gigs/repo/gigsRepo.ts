/**
 * Gigs domain repository.
 *
 * Phase 10b: typed wrappers around `supabase.from(...)` for gigs-owned
 * tables (gigs, marketplace_gigs, gig_projects, gig_project_milestones,
 * gig_project_messages, gig_escrow_accounts, gig_submissions,
 * gig_verifications, gig_matches, gig_match_digests, gig_review_assignments,
 * gig_disputes, reviewer_profiles, course_projects, withdrawal_requests).
 *
 * Rules:
 * - Named-export functions only; no React, no hooks here.
 * - Throws on error; callers use try/catch like edge wrappers.
 * - This is the ONLY place outside repos that may call `supabase.from`
 *   on gigs-owned tables (the ESLint guard enforces this in Phase 10j).
 */
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Project Room (talent)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjectRoomBundle(projectId: string) {
  const [pRes, mRes, eRes, msgRes] = await Promise.all([
    supabase.from("gig_projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("gig_project_milestones").select("*").eq("project_id", projectId).order("seq"),
    supabase.from("gig_escrow_accounts").select("*").eq("project_id", projectId).maybeSingle(),
    supabase
      .from("gig_project_messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at"),
  ]);
  if (pRes.error) throw pRes.error;
  if (mRes.error) throw mRes.error;
  return {
    project: pRes.data,
    milestones: mRes.data ?? [],
    escrow: eRes.data,
    messages: msgRes.data ?? [],
  };
}

export async function insertProjectMessage(input: {
  projectId: string;
  senderId: string;
  body: string;
}): Promise<void> {
  const { error } = await supabase.from("gig_project_messages").insert({
    project_id: input.projectId,
    sender_id: input.senderId,
    body: input.body,
  });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviewer Cockpit (talent)
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviewerCockpit(talentId: string) {
  const [p, a] = await Promise.all([
    supabase.from("reviewer_profiles").select("*").eq("talent_id", talentId).maybeSingle(),
    supabase
      .from("gig_review_assignments")
      .select("*")
      .eq("reviewer_id", talentId)
      .order("offered_at", { ascending: false }),
  ]);
  return { profile: p.data, assignments: a.data ?? [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviewer Program (admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviewerProgramBundle() {
  const [r, d, l] = await Promise.all([
    supabase
      .from("reviewer_profiles")
      .select("*")
      .order("accuracy", { ascending: false })
      .limit(100),
    supabase.from("gig_disputes").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("gig_review_assignments").select("status,kind"),
  ]);
  return {
    reviewers: r.data ?? [],
    disputes: d.data ?? [],
    assignments: l.data ?? [],
  };
}

export async function updateReviewerStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from("reviewer_profiles").update({ status }).eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gig Matchmaker (admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function getGigMatchFunnel() {
  const { data, error } = await supabase.from("gig_matches").select("status, gig_kind, score");
  if (error) throw error;
  return (data ?? []) as Array<{ status: string; gig_kind: string; score: number }>;
}

export async function countGigMatchDigests(): Promise<number> {
  const { count } = await supabase
    .from("gig_match_digests")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gig Graph (admin) — multi-table master fetch + generic mutators
// ─────────────────────────────────────────────────────────────────────────────

export async function getGigGraphSlice() {
  const [gigsRes, marketRes, courseRes, subRes, verifRes, walletRes] = await Promise.all([
    supabase
      .from("gigs")
      .select("id, title, status:is_active, reward_amount:credit_reward, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("marketplace_gigs")
      .select("id, title, status, budget:budget_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("course_projects")
      .select("id, status, created_at, course:course_id(title)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("gig_submissions")
      .select("id, gig_id, talent_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("gig_verifications")
      .select("id, talent_id, status:verdict, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("withdrawal_requests")
      .select("id, talent_id, amount:amount_credits, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (gigsRes.error) throw gigsRes.error;
  if (marketRes.error) throw marketRes.error;
  if (courseRes.error) throw courseRes.error;
  if (subRes.error) throw subRes.error;
  if (verifRes.error) throw verifRes.error;
  if (walletRes.error) throw walletRes.error;
  return {
    gigs: gigsRes.data ?? [],
    marketplaceGigs: marketRes.data ?? [],
    courseProjects: courseRes.data ?? [],
    submissions: subRes.data ?? [],
    verifications: verifRes.data ?? [],
    withdrawals: walletRes.data ?? [],
  };
}

export type GigGraphTable =
  | "gigs"
  | "marketplace_gigs"
  | "course_projects"
  | "gig_submissions"
  | "gig_verifications"
  | "withdrawal_requests";

export async function upsertGigGraphRow(
  table: GigGraphTable,
  payload: Record<string, unknown> & { id?: string },
): Promise<void> {
  if (payload.id) {
    const { error } = await supabase.from(table as any).update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table as any).insert(payload);
    if (error) throw error;
  }
}

export async function deleteGigGraphRow(table: GigGraphTable, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Talent submissions surface (MySubmissions + JobSharing flow)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyGigSubmissions(talentId: string) {
  const { data, error } = await supabase
    .from("gig_submissions")
    .select(
      "id, created_at, status, submission_data, ai_score, ai_feedback, admin_notes, credits_awarded, gigs(title, credit_reward, category)",
    )
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertGigSubmission(payload: {
  gig_id: string;
  talent_id: string;
  status: string;
  submission_data: Record<string, unknown>;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("gig_submissions")
    .insert(payload as any)
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

// ─── Phase 10j.5e: marketplace gigs (talent-facing) ───────────────────────
export async function getMarketplaceGigById(id: string) {
  const { data, error } = await supabase
    .from("marketplace_gigs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function getMyMarketplaceBidForGig(gigId: string, talentId: string) {
  const { data } = await supabase
    .from("marketplace_bids")
    .select("id, status, bid_amount")
    .eq("gig_id", gigId)
    .eq("talent_id", talentId)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function listMarketplaceReviewsForGig(gigId: string) {
  const { data } = await supabase
    .from("marketplace_reviews")
    .select("id, rating, comment, created_at, marketplace_contracts!inner(gig_id)")
    .eq("marketplace_contracts.gig_id", gigId)
    .order("created_at", { ascending: false });
  return (data as any[]) ?? [];
}

export async function insertMarketplaceBid(payload: {
  gig_id: string;
  talent_id: string;
  bid_amount: number;
  cover_letter: string;
  estimated_days: number | null;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("marketplace_bids").insert(payload as any);
  return { error };
}

export async function insertMarketplaceDeliverable(payload: {
  contract_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("marketplace_deliverables").insert(payload as any);
  return { error };
}

// ─── Phase 10j.6a: gigs/projects RPC helpers ───────────────────────────────
export async function getCompanyProjectPipeline(_company_id: string) {
  const { data, error } = await (supabase as any).rpc("get_company_project_pipeline", { _company_id });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function createGigProject(_payload: Record<string, any>) {
  const { data, error } = await (supabase as any).rpc("create_gig_project", { _payload });
  if (error) throw error;
  return data;
}

export async function addProjectMilestone(_project_id: string, _payload: Record<string, any>) {
  const { data, error } = await (supabase as any).rpc("add_project_milestone", { _project_id, _payload });
  if (error) throw error;
  return data;
}

export async function fundGigProject(_project_id: string): Promise<void> {
  const { error } = await (supabase as any).rpc("fund_gig_project", { _project_id });
  if (error) throw error;
}

export async function getEmployerGigBids(p_gig_id: string) {
  const { data, error } = await (supabase as any).rpc("get_employer_gig_bids", { p_gig_id });
  if (error) throw error;
  return (data ?? {}) as any;
}

export async function acceptGigBid(p_bid_id: string, p_company_id: string) {
  const { data, error } = await (supabase as any).rpc("accept_gig_bid", { p_bid_id, p_company_id });
  if (error) throw error;
  return data;
}

export async function rejectMarketplaceBid(id: string): Promise<void> {
  const { error } = await (supabase as any).from("marketplace_bids").update({ status: "rejected" }).eq("id", id);
  if (error) throw error;
}

// ─── Phase 10j.5h2: gig match RPC wrappers ────────────────────────────────
export async function recordMatchEvent(matchId: string, event: "view" | "dismiss" | "click" | "accept" | "reject"): Promise<void> {
  const { error } = await supabase.rpc("record_match_event", { _match_id: matchId, _event: event });
  if (error) throw error;
}

export async function matchGigsForTalent(talentId: string, limit = 20) {
  const { data, error } = await supabase.rpc("match_gigs_for_talent", { _talent_id: talentId, _limit: limit });
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Phase 10j.5h5: ranked/hub RPC wrappers ───────────────────────────────
export async function getRankedGigsForTalent(args: {
  talentId: string | null;
  cursor: number | null;
  limit: number;
}) {
  const { data, error } = await supabase.rpc("get_ranked_gigs_for_talent", {
    _talent_id: args.talentId,
    _cursor: args.cursor,
    _limit: args.limit,
  });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getGigsHubDashboard() {
  const { data, error } = await supabase.rpc("get_gigs_hub_dashboard");
  if (error) throw error;
  return data as any;
}

// ─── Phase 10j.5h8: verification, matches, disputes RPC wrappers ──────────
export async function openVerificationAppeal(args: {
  verificationId: string;
  reason: string;
  evidence?: any[];
}) {
  const { error } = await supabase.rpc("open_verification_appeal", {
    _verification_id: args.verificationId,
    _reason: args.reason,
    _evidence: args.evidence ?? [],
  });
  if (error) throw error;
}

export async function refreshGigMatches(args: { gigId: string; gigKind: string; limit?: number }) {
  const { error } = await supabase.rpc("refresh_gig_matches", {
    _gig_id: args.gigId,
    _gig_kind: args.gigKind,
    _limit: args.limit ?? 25,
  });
  if (error) throw error;
}

export async function shortlistMatch(matchId: string) {
  const { error } = await supabase.rpc("shortlist_match", { _match_id: matchId });
  if (error) throw error;
}

export async function openGigDispute(args: {
  gigId: string;
  submissionId?: string | null;
  verificationId?: string | null;
  openedByRole: string;
  reasonCode: string;
  narrative: string;
  evidence?: any[];
}) {
  const { error } = await supabase.rpc("open_gig_dispute", {
    _gig_id: args.gigId,
    _submission_id: args.submissionId ?? null,
    _verification_id: args.verificationId ?? null,
    _opened_by_role: args.openedByRole,
    _reason_code: args.reasonCode,
    _narrative: args.narrative,
    _evidence: args.evidence ?? [],
  });
  if (error) throw error;
}

export async function resolveDispute(args: { disputeId: string; verdict: string; notes: string }) {
  const { error } = await supabase.rpc("resolve_dispute", {
    _dispute_id: args.disputeId,
    _verdict: args.verdict,
    _notes: args.notes,
  });
  if (error) throw error;
}

// ─── Phase 10j.5h9 ────────────────────────────────────────────────────────
export async function submitCalibrationAttempt(args: { passed: boolean }) {
  const { error } = await supabase.rpc("submit_calibration_attempt", {
    _score: args.passed ? 85 : 60,
    _answers: {},
  });
  if (error) throw error;
}

export async function claimReviewAssignment<T = any>(assignmentId: string): Promise<T> {
  const { data, error } = await supabase.rpc("claim_review_assignment", { _assignment_id: assignmentId });
  if (error) throw error;
  return data as T;
}

export async function submitReviewVerdict(args: {
  assignmentId: string;
  verdict: string;
  payload?: Record<string, unknown>;
  confidence: number;
  rationale: string;
}) {
  const { error } = await supabase.rpc("submit_review_verdict", {
    _assignment_id: args.assignmentId,
    _verdict: args.verdict,
    _payload: (args.payload ?? {}) as any,
    _confidence: args.confidence,
    _rationale: args.rationale,
  });
  if (error) throw error;
}

export async function submitMilestoneDeliverables(args: {
  milestoneId: string;
  payload: Record<string, unknown>;
}) {
  const { error } = await supabase.rpc("submit_milestone_deliverables", {
    _milestone_id: args.milestoneId,
    _payload: args.payload as any,
  });
  if (error) throw error;
}

export async function publishGigFromDraft(draftId: string): Promise<string> {
  const { data, error } = await supabase.rpc("publish_gig_from_draft", { _draft_id: draftId });
  if (error) throw error;
  return data as string;
}

export async function getTalentProjectWorkload<T = any>(talentId: string): Promise<T[]> {
  const { data, error } = await supabase.rpc("get_talent_project_workload", { _talent_id: talentId });
  if (error) throw error;
  return ((data as unknown) as T[]) ?? [];
}
