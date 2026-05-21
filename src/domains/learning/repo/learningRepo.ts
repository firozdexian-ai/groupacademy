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

/* ---------------- Course sessions (admin manager) ---------------- */

export async function listCourseSessionsByContent(contentId: string) {
  const { data, error } = await supabase
    .from("course_sessions")
    .select("*")
    .eq("content_id", contentId)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listInstructorsLite() {
  const { data, error } = await supabase
    .from("instructors")
    .select("id, full_name")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function deleteCourseSession(id: string) {
  const { error } = await supabase.from("course_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCourseSessionStatus(id: string, status: string) {
  const { error } = await supabase.from("course_sessions").update({ status: status as any }).eq("id", id);
  if (error) throw error;
}

export async function bulkInsertCourseSessions(rows: Record<string, unknown>[]) {
  const { error } = await supabase.from("course_sessions").insert(rows as any);
  if (error) throw error;
}

/* ---------------- Progress (admin) ---------------- */

export async function listEnrollmentStatsRaw(contentId?: string) {
  let query = supabase.from("enrollments").select(`
      id, status, content_id, enrolled_at, completed_at,
      content:content_id (id, title, modules_count)
    `);
  if (contentId && contentId !== "all") query = query.eq("content_id", contentId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listLearnerDetailsRaw(contentId?: string, limit = 50) {
  let query = supabase
    .from("enrollments")
    .select(
      `id, status, enrolled_at, completed_at, content_id, talent_id,
       talents:talent_id (id, full_name, email),
       content:content_id (id, title, modules_count)`,
    )
    .order("enrolled_at", { ascending: false })
    .limit(limit);
  if (contentId && contentId !== "all") query = query.eq("content_id", contentId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listPublishedCourses() {
  const { data, error } = await supabase
    .from("content")
    .select("id, title, content_type")
    .in("content_type", ["recorded_course", "batch_class", "live_webinar"])
    .eq("is_published", true)
    .order("title");
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Moderation ---------------- */

export type ModerationTable =
  | "discussion_posts"
  | "discussion_threads"
  | "lesson_questions"
  | "lesson_answers";

export async function listContentReports(limit = 100) {
  const { data, error } = await supabase
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function resolveContentReport(id: string, status: "dismissed" | "removed") {
  const { error } = await supabase
    .from("content_reports")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function hideModerationTarget(table: ModerationTable, scopeId: string) {
  const { error } = await supabase.from(table).update({ is_hidden: true } as any).eq("id", scopeId);
  if (error) throw error;
}

/* ---------------- JSON / bulk importers ---------------- */

export async function insertContent(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from("content").insert(payload as any).select().single();
  if (error) throw error;
  return data;
}

export async function insertCourseModule(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("course_modules")
    .insert(payload as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertModuleResources(rows: Record<string, unknown>[]) {
  const { error } = await supabase.from("module_resources").insert(rows as any);
  if (error) throw error;
}

/* ---------------- Content readiness ---------------- */

export async function setContentPublished(contentId: string, isPublished: boolean) {
  const { error } = await supabase
    .from("content")
    .update({ is_published: isPublished })
    .eq("id", contentId);
  if (error) throw error;
}

/* ---------------- Talent tracks landing ---------------- */

export async function listAcademiesSchoolsReadiness() {
  const [acadResult, schoolResult, readinessResult] = await Promise.all([
    supabase.from("academies").select("*").eq("is_active", true).order("display_order"),
    supabase.from("schools").select("*").eq("is_active", true).order("display_order"),
    supabase.from("school_readiness_v" as any).select("*"),
  ]);
  if (acadResult.error) throw acadResult.error;
  if (schoolResult.error) throw schoolResult.error;
  if (readinessResult.error) throw readinessResult.error;
  return {
    academies: acadResult.data ?? [],
    schools: schoolResult.data ?? [],
    readiness: (readinessResult.data as any[]) ?? [],
  };
}

/* ---------------- Content filters ---------------- */

export async function listProfessionCategoriesAndLevels() {
  const [progRes, lvlRes] = await Promise.all([
    supabase.from("profession_categories").select("id, name").order("name"),
    supabase.from("profession_levels").select("id, name").order("display_order"),
  ]);
  if (progRes.error) throw progRes.error;
  if (lvlRes.error) throw lvlRes.error;
  return { programs: progRes.data ?? [], levels: lvlRes.data ?? [] };
}

/* ---------------- Batch content generator ---------------- */

export type DraftPostTable = "blog_posts" | "feed_posts";

export async function listSchoolsLite() {
  const { data, error } = await supabase.from("schools").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listProgramsBySchool(schoolId: string) {
  const { data, error } = await supabase
    .from("profession_categories")
    .select("id")
    .eq("school_id", schoolId);
  if (error) throw error;
  return data ?? [];
}

export async function listContentsByProgramIds(programIds: string[]) {
  if (!programIds.length) return [];
  const { data, error } = await supabase
    .from("content")
    .select("id, description, learning_objectives, estimated_hours")
    .in("profession_line_id", programIds);
  if (error) throw error;
  return data ?? [];
}

export async function listModulesByContentIds(contentIds: string[]) {
  if (!contentIds.length) return [];
  const { data, error } = await supabase
    .from("course_modules")
    .select("id, description")
    .in("content_id", contentIds);
  if (error) throw error;
  return data ?? [];
}

export async function listQuizQuestionsByModuleIds(moduleIds: string[]) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("module_id")
    .in("module_id", moduleIds);
  if (error) throw error;
  return data ?? [];
}

export async function listModuleResourcesByType(moduleIds: string[], resourceType: string) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase
    .from("module_resources")
    .select("module_id")
    .in("module_id", moduleIds)
    .eq("resource_type", resourceType as any);
  if (error) throw error;
  return data ?? [];
}

export async function listDraftPosts(table: DraftPostTable, status: string) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateDraftPost(
  table: DraftPostTable,
  id: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from(table).update(payload as any).eq("id", id);
  if (error) throw error;
}

/* ---------------- Admin learning graph ---------------- */

export type LearningGraphTable =
  | "content"
  | "enrollments"
  | "cohorts"
  | "course_briefs"
  | "course_engagements"
  | "course_sessions"
  | "certificates"
  | "instructor_payout_requests";

export async function getLearningGraphSlice() {
  const [contentRes, enrollRes, cohortsRes, briefsRes, engageRes, sessionsRes, certsRes, payoutsRes] =
    await Promise.all([
      supabase
        .from("content")
        .select("id, title, content_type, is_published, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("enrollments")
        .select("id, content_id, talent_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("cohorts")
        .select("id, content_id, name, starts_on, status")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("course_briefs")
        .select("id, title, status, instructor_user_id")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("course_engagements")
        .select("id, brief_id, user_id, status")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("course_sessions")
        .select("id, cohort_id, content_id, title, scheduled_date")
        .order("scheduled_date", { ascending: false })
        .limit(200),
      supabase
        .from("certificates")
        .select("id, enrollment_id, talent_id, issued_at")
        .order("issued_at", { ascending: false })
        .limit(200),
      supabase
        .from("instructor_payout_requests")
        .select("id, instructor_user_id, amount_credits, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
  if (contentRes.error) throw contentRes.error;
  if (enrollRes.error) throw enrollRes.error;
  if (cohortsRes.error) throw cohortsRes.error;
  if (briefsRes.error) throw briefsRes.error;
  if (engageRes.error) throw engageRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (certsRes.error) throw certsRes.error;
  if (payoutsRes.error) throw payoutsRes.error;
  return {
    content: contentRes.data ?? [],
    enrollments: enrollRes.data ?? [],
    cohorts: cohortsRes.data ?? [],
    courseBriefs: briefsRes.data ?? [],
    courseEngagements: engageRes.data ?? [],
    courseSessions: sessionsRes.data ?? [],
    certificates: certsRes.data ?? [],
    payouts: payoutsRes.data ?? [],
  };
}

export async function upsertLearningGraphRow(
  table: LearningGraphTable,
  payload: Record<string, any>,
) {
  if (payload.id) {
    const { error } = await supabase.from(table).update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table).insert(payload as any);
    if (error) throw error;
  }
}

export async function deleteLearningGraphRow(table: LearningGraphTable, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

