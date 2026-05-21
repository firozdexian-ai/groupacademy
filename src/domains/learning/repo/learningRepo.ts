/**
 * Learning domain repository.
 *
 * Single entry point for `supabase.from(...)` calls that the learning hooks
 * use. Mirrors the conventions established in jobsRepo / gigsRepo:
 *   - Named async functions
 *   - Throws on error (callers decide React-Query semantics)
 *   - No React / no toasts
 *
 * Phase 10c.1: hook surface only. Admin/talent component reads will be
 * folded in during 10c.2.
 */
import { supabase } from "@/integrations/supabase/client";

/* ---------------- Progress / stage progress ---------------- */

export interface StageProgressUpsert {
  enrollment_id: string;
  module_id: string;
  completed_stages: number[];
  current_stage: number;
  resource_view_states: Record<string, boolean>;
}

export async function getStageProgress(enrollmentId: string, moduleId: string) {
  const { data, error } = await supabase
    .from("enrollment_stage_progress")
    .select("completed_stages, current_stage, resource_view_states")
    .eq("enrollment_id", enrollmentId)
    .eq("module_id", moduleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertEnrollmentStageProgress(input: StageProgressUpsert) {
  const { error } = await supabase.from("enrollment_stage_progress").upsert(
    {
      ...input,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "enrollment_id,module_id" },
  );
  if (error) throw error;
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  patch: { progress?: number; current_module_id?: string; last_accessed_at?: string },
) {
  const { error } = await supabase.from("enrollments").update(patch).eq("id", enrollmentId);
  if (error) throw error;
}

export async function getEnrollmentProgressBundle(enrollmentId: string, contentId: string) {
  const [cmRes, mpRes, enrRes, espRes] = await Promise.all([
    supabase
      .from("course_modules")
      .select("id, display_order, title")
      .eq("content_id", contentId)
      .order("display_order", { ascending: true }),
    supabase
      .from("module_progress")
      .select("module_id, stages_completed, total_stages, progress_pct, started_at, completed_at")
      .eq("enrollment_id", enrollmentId),
    supabase
      .from("enrollments")
      .select("progress, status, current_module_id")
      .eq("id", enrollmentId)
      .maybeSingle(),
    supabase
      .from("enrollment_stage_progress")
      .select("module_id, resource_view_states")
      .eq("enrollment_id", enrollmentId),
  ]);
  if (cmRes.error) throw cmRes.error;
  if (mpRes.error) throw mpRes.error;
  if (enrRes.error) throw enrRes.error;
  if (espRes.error) throw espRes.error;
  return {
    modules: cmRes.data ?? [],
    moduleProgress: mpRes.data ?? [],
    enrollment: enrRes.data,
    stageProgress: espRes.data ?? [],
  };
}

/* ---------------- Certificates ---------------- */

export async function getCertificateByEnrollment(enrollmentId: string) {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------------- Org wallet (learning Ops) ---------------- */

export async function getCompanyWallet(companyId: string) {
  const [balanceResult, transactionsResult] = await Promise.all([
    supabase
      .from("company_credits")
      .select("balance, earned_balance")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("company_credit_transactions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (balanceResult.error) throw balanceResult.error;
  if (transactionsResult.error) throw transactionsResult.error;
  return {
    balance: balanceResult.data,
    transactions: transactionsResult.data ?? [],
  };
}

/* ---------------- Learning tracks ---------------- */

export async function updateLearningTrack(id: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("learning_tracks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listLearningTrackItems(trackId: string) {
  const { data, error } = await supabase
    .from("learning_track_items")
    .select("id, content_id, position, is_required, content(title, slug, credit_cost)")
    .eq("track_id", trackId)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export async function insertLearningTrackItem(input: {
  track_id: string;
  content_id: string;
  position: number;
  is_required: boolean;
}) {
  const { error } = await supabase.from("learning_track_items").insert(input);
  if (error) throw error;
}

export async function deleteLearningTrackItem(id: string) {
  const { error } = await supabase.from("learning_track_items").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Cohorts & course sessions ---------------- */

export async function upsertCohort(
  input: { id?: string; content_id: string } & Record<string, unknown>,
) {
  const { id, ...rest } = input;
  if (id) {
    const { error } = await supabase.from("cohorts").update(rest).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("cohorts").insert(rest as any);
    if (error) throw error;
  }
}

export async function upsertCourseSession(
  input: { id?: string; cohort_id?: string | null } & Record<string, unknown>,
) {
  const { id, ...rest } = input;
  if (id) {
    const { error } = await supabase.from("course_sessions").update(rest).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("course_sessions").insert(rest as any);
    if (error) throw error;
  }
}
