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


// ─── Phase 10j.2 — Discussions / Q&A / Submissions ─────────────────────────
export async function listDiscussionThreads(cohortId: string) {
  const { data, error } = await supabase
    .from("discussion_threads")
    .select("*")
    .eq("cohort_id", cohortId)
    .order("is_pinned", { ascending: false })
    .order("last_post_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getDiscussionThreadWithPosts(threadId: string) {
  const [{ data: thread, error: threadError }, { data: posts, error: postsError }] = await Promise.all([
    supabase.from("discussion_threads").select("*").eq("id", threadId).maybeSingle(),
    supabase.from("discussion_posts").select("*").eq("thread_id", threadId).order("created_at"),
  ]);
  if (threadError) throw threadError;
  if (postsError) throw postsError;
  return { thread, posts: posts ?? [] };
}

export async function insertDiscussionThread(payload: { cohort_id: string; title: string; body?: string; author_id: string }) {
  const { data, error } = await supabase
    .from("discussion_threads")
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertDiscussionPost(payload: { thread_id: string; body: string; parent_post_id?: string; author_id: string }) {
  const { error } = await supabase.from("discussion_posts").insert(payload);
  if (error) throw error;
}

export async function listLessonQuestions(contentId: string, itemId?: string) {
  let query = supabase.from("lesson_questions").select("*, answers:lesson_answers(*)").eq("content_id", contentId);
  if (itemId) query = query.eq("item_id", itemId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function insertLessonQuestion(payload: {
  content_id: string;
  item_id?: string;
  module_id?: string;
  cohort_id?: string;
  body: string;
  author_id: string;
}) {
  const { error } = await supabase.from("lesson_questions").insert(payload);
  if (error) throw error;
}

export async function insertLessonAnswer(payload: { question_id: string; body: string; author_id: string }) {
  const { error } = await supabase.from("lesson_answers").insert(payload);
  if (error) throw error;
}

export async function listReviewQueueForReviewer(reviewerId: string) {
  const { data, error } = await supabase
    .from("review_assignments")
    .select("*, submission:submission_id(id, title, kind, content_id, author_id)")
    .eq("reviewer_id", reviewerId)
    .eq("status", "pending")
    .order("due_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSubmissionWithReviews(id: string) {
  const [
    { data: sub, error: subError },
    { data: reviews, error: revError },
    { data: assigns, error: assignError },
  ] = await Promise.all([
    supabase.from("submissions").select("*").eq("id", id).maybeSingle(),
    supabase.from("submission_reviews").select("*").eq("submission_id", id),
    supabase.from("review_assignments").select("*").eq("submission_id", id),
  ]);
  if (subError) throw subError;
  if (revError) throw revError;
  if (assignError) throw assignError;
  return { submission: sub, reviews: reviews ?? [], assignments: assigns ?? [] };
}

export async function upsertSubmissionReview(payload: {
  submission_id: string;
  reviewer_id: string;
  rubric: any;
  score: number;
  comments?: string | null;
}) {
  const { error } = await supabase
    .from("submission_reviews")
    .upsert(payload, { onConflict: "submission_id,reviewer_id" });
  if (error) throw error;
}

export async function insertContentReport(payload: { scope: string; scope_id: string; reason: string; reporter_id: string }) {
  const { error } = await supabase.from("content_reports").insert(payload);
  if (error) throw error;
}

/* ---------------- Phase 10j.3: shared component helpers ---------------- */

export async function getContentIdBySlug(slug: string): Promise<string | null> {
  const { data } = await supabase.from("content").select("id").eq("slug", slug).maybeSingle();
  return ((data as any)?.id as string | null) ?? null;
}

export async function findStudentIdByUserId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return ((data as any)?.id as string | null) ?? null;
}

export async function requireStudentIdByUserId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return String((data as any).id);
}

export async function getActiveAccessCode(
  code: string,
  contentId: string,
): Promise<any | null> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", code)
    .eq("content_id", contentId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function insertEnrollmentRow(payload: {
  student_id: string;
  content_id: string;
  status: string;
  payment_amount: number;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("enrollments").insert(payload as any);
  return { error };
}

export async function insertQuizAttempt(payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("quiz_attempts").insert(payload as any);
  if (error) throw error;
}

export async function listQuizQuestionsByModule(moduleId: string) {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("module_id", moduleId)
    .order("display_order");
  return { data: data as any[] | null, error };
}

export async function listFallbackQuizQuestionsByContent(contentId: string) {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("content_id", contentId)
    .is("module_id", null)
    .order("display_order");
  return { data: data as any[] | null, error };
}

export async function getAiInstructorName(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_instructors")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return ((data as any)?.name as string | null) ?? null;
}

// -----------------------------------------------------------------------------
// Phase 10j.3b additions
// -----------------------------------------------------------------------------

export async function listAssessmentQuestionsForCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("is_active", true)
    .or(`profession_category_id.is.null,profession_category_id.eq.${categoryId}`)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getUpcomingPublishedEvent(daysAhead = 14) {
  const horizonIso = new Date(Date.now() + daysAhead * 86400000).toISOString();
  const { data, error } = await supabase
    .from("content")
    .select("title, slug, event_date, event_timezone, price")
    .in("content_type", ["live_webinar", "batch_class"])
    .eq("is_published", true)
    .eq("is_private", false)
    .gte("event_date", new Date().toISOString())
    .lte("event_date", horizonIso)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function listTalentSkillMastery(moduleId: string, signal?: AbortSignal) {
  const { data, error } = await supabase
    .from("talent_skill_profile")
    .select("topic_tag, mastery, attempts")
    .eq("module_id", moduleId)
    .order("attempts", { ascending: false })
    .limit(50)
    .abortSignal(signal!);
  if (error) throw error;
  return (data ?? []) as Array<{ topic_tag: string; mastery: number; attempts: number }>;
}

export async function getInstructorRecentEarningsCount(instructorUserId: string, sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("instructor_earnings_ledger" as any)
    .select("id", { count: "exact", head: true })
    .eq("instructor_user_id", instructorUserId)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

export async function listContentSlugsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("content")
    .select("id, slug")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; slug: string | null }>;
}

export async function listEnrollmentsForContent(contentId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id,status,progress,current_module_id,last_accessed_at,enrolled_at,talent_id")
    .eq("content_id", contentId);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCourseModulesForContent(contentId: string) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("id,title,display_order")
    .eq("content_id", contentId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listQuizAttemptsForModules(moduleIds: string[]) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase
    .from("talent_quiz_attempt")
    .select("id,module_id,score,created_at,talent_id")
    .in("module_id", moduleIds);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listScenarioRunsForModules(moduleIds: string[]) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase
    .from("talent_scenario_run")
    .select("id,module_id,evaluation,created_at,talent_id")
    .in("module_id", moduleIds);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listModuleQuizPoolForModules(moduleIds: string[]) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase
    .from("module_quiz_pool")
    .select("module_id,quality_score,times_served")
    .in("module_id", moduleIds);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listModuleScenarioPoolForModules(moduleIds: string[]) {
  if (!moduleIds.length) return [];
  const { data, error } = await supabase
    .from("module_scenario_pool")
    .select("module_id,quality_score,times_served")
    .in("module_id", moduleIds);
  if (error) throw error;
  return (data ?? []) as any[];
}

/* ---------------- Instructor CRUD (admin) ---------------- */

export async function listAllInstructors() {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getInstructorById(id: string) {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function insertInstructor(payload: Record<string, unknown>) {
  const { error } = await supabase.from("instructors").insert([payload as any]);
  if (error) throw error;
}

export async function updateInstructor(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("instructors")
    .update(patch as any)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInstructor(id: string) {
  const { error } = await supabase.from("instructors").delete().eq("id", id);
  if (error) throw error;
}

export async function listActiveInstructorsBasic() {
  const { data, error } = await supabase
    .from("instructors")
    .select("id, full_name")
    .eq("status", "active")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Sessions (admin lists & CRUD) ---------------- */

export async function listAllSessionsWithRelations() {
  const { data, error } = await supabase
    .from("course_sessions")
    .select(`
      *,
      content:content_id ( id, title, slug ),
      instructors:instructor_id ( id, full_name, profile_image_url )
    `)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertCourseSession(payload: Record<string, unknown>) {
  const { error } = await supabase.from("course_sessions").insert(payload as any);
  if (error) throw error;
}

/* ---------------- Content (admin lists) ---------------- */

export async function listPublishedContentBasic() {
  const { data, error } = await supabase
    .from("content")
    .select("id, title")
    .eq("is_published", true)
    .order("title");
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Students & Enrollments (admin lists) ---------------- */

export async function listStudentsWithEnrollments() {
  const { data, error } = await supabase
    .from("students")
    .select(`*, enrollments(id, status, enrolled_at, content:content_id(title, content_type))`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listEnrollmentsWithRelations() {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      *,
      student:student_id(full_name, student_id),
      content:content_id(title, content_type, event_date, max_capacity, current_enrollment)
    `)
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Phase 10j.5b: learning admin pages ---------------- */

// Content row helpers (admin edit/quiz/module pages)
export async function getContentById(id: string) {
  const { data, error } = await supabase.from("content").select("*").eq("id", id).single();
  if (error) throw error;
  return data as any;
}

export async function getContentBasic(id: string) {
  const { data, error } = await supabase
    .from("content")
    .select("title, content_type")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { title: string; content_type: string } | null;
}

export async function getContentSlim(id: string) {
  const { data, error } = await supabase
    .from("content")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; title: string } | null;
}

export async function updateContent(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("content").update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function updateContentQuizSettings(
  contentId: string,
  passThreshold: number,
  quizEnabled = true,
) {
  const { error } = await supabase
    .from("content")
    .update({ pass_threshold: passThreshold, quiz_enabled: quizEnabled })
    .eq("id", contentId);
  if (error) throw error;
}

export async function getContentBySlugPublished(slug: string) {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function getContentBySlugMaybe(slug: string) {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data as any;
}

export async function getContentBySlugWithProfession(slug: string) {
  const { data, error } = await supabase
    .from("content")
    .select("*, profession_categories:profession_line_id(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function countCourseSessionsForContent(contentId: string): Promise<number> {
  const { count, error } = await supabase
    .from("course_sessions")
    .select("*", { count: "exact", head: true })
    .eq("content_id", contentId);
  if (error) throw error;
  return count ?? 0;
}

// course_sessions admin CRUD
export async function getCourseSessionById(id: string) {
  const { data, error } = await supabase.from("course_sessions").select("*").eq("id", id).single();
  if (error) throw error;
  return data as any;
}

export async function updateCourseSession(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("course_sessions").update(patch as any).eq("id", id);
  if (error) throw error;
}

// course_modules admin CRUD
export async function getCourseModuleById(id: string) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function listCourseModulesForContentFull(contentId: string) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("id, content_id, title, description, video_url, duration_minutes, display_order, is_preview")
    .eq("content_id", contentId)
    .order("display_order", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCourseModuleSummariesForContent(contentId: string) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("id, title, description, video_url")
    .eq("content_id", contentId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCourseModulesByDisplayOrder(contentId: string) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .eq("content_id", contentId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCourseModulesLite(contentId: string) {
  const { data, error } = await supabase
    .from("course_modules")
    .select("id, title, display_order")
    .eq("content_id", contentId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function insertCourseModuleReturning(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("course_modules")
    .insert([payload as any])
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateCourseModule(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("course_modules").update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function deleteCourseModule(id: string) {
  const { error } = await supabase.from("course_modules").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkUpdateCourseModuleOrder(
  updates: Array<{ id: string; display_order: number }>,
) {
  await Promise.all(
    updates.map((row) =>
      supabase.from("course_modules").update({ display_order: row.display_order }).eq("id", row.id),
    ),
  );
}

// module_resources helpers
export async function listModuleResourceLinksForModules(moduleIds: string[]) {
  if (!moduleIds.length) return [] as Array<{ module_id: string; resource_url: string | null }>;
  const { data, error } = await supabase
    .from("module_resources")
    .select("module_id, resource_url")
    .in("module_id", moduleIds);
  if (error) throw error;
  return (data ?? []) as Array<{ module_id: string; resource_url: string | null }>;
}

export async function listModuleResourceModuleIdsForModules(moduleIds: string[]) {
  if (!moduleIds.length) return [] as Array<{ module_id: string }>;
  const { data, error } = await supabase
    .from("module_resources")
    .select("module_id")
    .in("module_id", moduleIds);
  if (error) throw error;
  return (data ?? []) as Array<{ module_id: string }>;
}

export async function listModuleResourcesForModule(moduleId: string) {
  const { data, error } = await supabase
    .from("module_resources")
    .select("*")
    .eq("module_id", moduleId)
    .order("stage_number", { ascending: true })
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function insertModuleResourceReturning(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("module_resources")
    .insert([payload as any])
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateModuleResourceReturning(id: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("module_resources")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function deleteModuleResourceById(id: string) {
  const { error } = await supabase.from("module_resources").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkUpdateModuleResourceOrder(
  updates: Array<{ id: string; display_order: number }>,
) {
  await Promise.all(
    updates.map((row) =>
      supabase.from("module_resources").update({ display_order: row.display_order }).eq("id", row.id),
    ),
  );
}

// quiz_questions admin
export async function listQuizQuestionsByModuleOrdered(moduleId: string) {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("module_id", moduleId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listQuizQuestionsByContentOrdered(contentId: string) {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("content_id", contentId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function deleteQuizQuestionsForModule(moduleId: string) {
  const { error } = await supabase.from("quiz_questions").delete().eq("module_id", moduleId);
  if (error) throw error;
}

export async function insertQuizQuestions(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabase.from("quiz_questions").insert(rows as any);
  if (error) throw error;
}

// students / enrollments (learner-facing)
export async function getStudentRecordByUserId(userId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function getStudentIdByUserIdStrict(userId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return String((data as any).id);
}

export async function getEnrollmentForStudentAndContent(studentId: string, contentId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("content_id", contentId)
    .single();
  if (error) throw error;
  return data as { id: string; status: string };
}

export async function findEnrollmentIdForStudentAndContent(studentId: string, contentId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("content_id", contentId)
    .maybeSingle();
  if (error) throw error;
  return ((data as any)?.id as string | null) ?? null;
}

export async function getEnrollmentForActorIds(contentId: string, actorIds: string[]) {
  const orFilter = actorIds
    .filter(Boolean)
    .map((id) => `talent_id.eq.${id},student_id.eq.${id}`)
    .join(",");
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("content_id", contentId)
    .in("status", ["active", "completed"])
    .or(orFilter)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function updateEnrollmentRow(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("enrollments").update(patch as any).eq("id", id);
  if (error) throw error;
}

// ai_instructors
export async function getActiveAIInstructorByProfessionLine(professionLineId: string) {
  const { data, error } = await supabase
    .from("ai_instructors")
    .select("*")
    .eq("profession_line_id", professionLineId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}


export async function getCertificateById(id: string) {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as any;
}

// ─── Phase 10j.5d additions ────────────────────────────────────────────────
export async function listContentByIdsBasic(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("content")
    .select("id, title, slug, thumbnail_url")
    .in("id", ids);
  if (error) throw error;
  return (data as any[]) ?? [];
}

// ─── Phase 10j.5e: instructor review queue + IELTS access ──────────────────
export async function listPublishedContentIdsLimit(limit = 50): Promise<string[]> {
  const { data } = await supabase
    .from("content")
    .select("id")
    .eq("is_published", true)
    .limit(limit);
  return ((data as any[]) ?? []).map((c) => c.id as string);
}

export async function findInstructorIdByEmail(email: string): Promise<string | null> {
  const { data } = await supabase
    .from("instructors")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

export async function listContentIdsForInstructor(instructorId: string): Promise<string[]> {
  const { data } = await supabase
    .from("content_instructors")
    .select("content_id")
    .eq("instructor_id", instructorId);
  return ((data as any[]) ?? []).map((r) => r.content_id as string);
}

export async function listCourseModuleIdsByContentIds(contentIds: string[]): Promise<string[]> {
  if (!contentIds.length) return [];
  const { data } = await supabase
    .from("course_modules")
    .select("id")
    .in("content_id", contentIds);
  return ((data as any[]) ?? []).map((m) => m.id as string);
}

export async function insertIeltsResourceAccess(talentId: string, resourceId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("ielts_resource_access")
    .insert([{ talent_id: talentId, resource_id: resourceId } as any]);
  return { error };
}

// ─── Phase 10j.6a: learning RPC helpers ────────────────────────────────────
export async function getInstructorEarningsSummary() {
  const { data, error } = await (supabase as any).rpc("get_instructor_earnings_summary");
  if (error) throw error;
  return data;
}

export async function acceptLessonAnswer(_question_id: string, _answer_id: string): Promise<void> {
  const { error } = await supabase.rpc("accept_lesson_answer", { _question_id, _answer_id });
  if (error) throw error;
}

// ─── Phase 10j.5g: gro10x B2B catalog + assignments ───────────────────────
export interface B2BCatalogCourse {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  duration_hours: number | null;
  credit_cost: number | null;
  b2b_audience: string[] | null;
}

export async function listB2BCatalog(): Promise<B2BCatalogCourse[]> {
  const { data, error } = await supabase
    .from("content")
    .select("id,title,slug,description,thumbnail_url,cover_image_url,duration_hours,credit_cost,b2b_audience")
    .eq("is_b2b", true)
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as B2BCatalogCourse[];
}

export async function listMyCompanyCourseAssignments(
  userId: string,
  companyId: string | null,
): Promise<any[]> {
  const orFilter = companyId
    ? `assigned_to.eq.${userId},and(assigned_to.is.null,company_id.eq.${companyId})`
    : `assigned_to.eq.${userId}`;
  const { data, error } = await supabase
    .from("company_course_assignments")
    .select(
      `id, company_id, content_id, assigned_to, due_at, sponsorship_mode, credit_cost, note, created_at,
       content:content_id ( id, title, slug, description, thumbnail_url, cover_image_url, duration_hours, credit_cost, b2b_audience ),
       company:company_id ( name )`,
    )
    .or(orFilter)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, company_name: r.company?.name ?? null }));
}

export async function listCompanyCourseAssignmentsByCompany(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_course_assignments")
    .select(
      `id, content_id, assigned_to, sponsorship_mode, credit_cost, due_at, created_at,
       content:content_id ( id, title, thumbnail_url )`,
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Phase 10j.5g2: course project + subtasks (CourseProjectDetail) ───────
export async function getCourseProjectById(id: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from("course_projects")
    .select("id, course_id, status, claimed_by, deadline, total_credit_reward, progress_percent")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function getCourseProjectCourse(courseId: string): Promise<any | null> {
  const { data } = await supabase
    .from("content")
    .select("id, title, description, cover_image_url")
    .eq("id", courseId)
    .maybeSingle();
  return data ?? null;
}

export async function listCourseProjectSubtasks(projectId: string): Promise<any[]> {
  const { data } = await supabase
    .from("course_project_subtasks")
    .select(
      "id, project_id, title, kind, status, brief, expected_format, credit_reward, display_order, submitted_files, submitted_notes, reviewer_notes",
    )
    .eq("project_id", projectId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as any[];
}

export async function submitCourseProject(projectId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("course_projects")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", projectId);
  return { error };
}

export async function updateCourseProjectSubtask(
  subtaskId: string,
  patch: Record<string, any>,
): Promise<{ error: any }> {
  const { error } = await supabase.from("course_project_subtasks").update(patch).eq("id", subtaskId);
  return { error };
}

export async function claimCourseProject(projectId: string): Promise<any> {
  const { data, error } = await supabase.rpc("claim_course_project", { p_project_id: projectId });
  if (error) throw error;
  return data;
}

// ─── Phase 10j.5g4 ─────────────────────────────────────────────────────────
export async function listRecommendedCoursesForProfession(
  professionLineId: string,
  limit = 3,
  publishedOnly = false,
) {
  let q = supabase
    .from("content")
    .select("id, title, slug, description, estimated_hours, thumbnail_url")
    .eq("profession_line_id", professionLineId)
    .limit(limit);
  if (publishedOnly) q = q.eq("is_published", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    estimated_hours: number | null;
    thumbnail_url: string | null;
  }>;
}

export async function listPublicCoursesCatalog(limit = 12) {
  const { data, error } = await supabase
    .from("content")
    .select(
      "id, title, slug, description, cover_image_url, thumbnail_url, content_type, duration_hours, current_enrollment, instructor_name, modules_count",
    )
    .eq("is_published", true)
    .eq("is_private", false)
    .eq("is_ready", true)
    .in("content_type", ["recorded_course", "batch_class", "free_video"])
    .order("current_enrollment", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getPublicWebinarBySlug(slug: string) {
  const { data, error } = await supabase
    .from("content")
    .select(
      "id, title, slug, description, content_type, cover_image_url, event_date, event_timezone, event_duration_minutes, max_capacity, current_enrollment, instructor_name, price",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

// ─── Phase 10j.5h3: RPC wrappers ──────────────────────────────────────────
export async function enrollLearningTrack(trackId: string): Promise<string> {
  const { data, error } = await supabase.rpc("talent_enroll_track", { p_track_id: trackId });
  if (error) throw error;
  return data as string;
}

export async function upcomingSessionsForUser(args: { userId: string; limit: number }) {
  const { data, error } = await supabase.rpc("upcoming_sessions_for_user", {
    _user_id: args.userId,
    _limit: args.limit,
  });
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Phase 10j.5h7: Learning / Org RPC wrappers ───────────────────────────
export async function getTutorMasteryContext(args: {
  talentId: string;
  moduleId?: string | null;
  contentId?: string | null;
}): Promise<any> {
  const { data, error } = await supabase.rpc("get_tutor_mastery_context", {
    _talent_id: args.talentId,
    _module_id: args.moduleId ?? null,
    _content_id: args.contentId ?? null,
  });
  if (error) throw error;
  return data;
}

export async function getOrgLearningHealth<T = any>(companyId: string): Promise<T> {
  const { data, error } = await supabase.rpc("org_learning_health", { p_company_id: companyId });
  if (error) throw error;
  return data as T;
}

export async function getOrgTeamMastery<T = any>(args: {
  companyId: string;
  contentId?: string | null;
}): Promise<T[]> {
  const { data, error } = await supabase.rpc("org_team_mastery", {
    p_company_id: args.companyId,
    p_content_id: args.contentId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function orgAssignTalents(input: {
  company_id: string;
  content_id: string;
  cohort_id?: string | null;
  user_ids: string[];
  due_at?: string | null;
  budget_per_seat?: number | null;
  note?: string | null;
}): Promise<any> {
  const { data, error } = await supabase.rpc("org_assign_talents", {
    p_company_id: input.company_id,
    p_content_id: input.content_id,
    p_cohort_id: input.cohort_id ?? null,
    p_user_ids: input.user_ids,
    p_due_at: input.due_at ?? null,
    p_budget_per_seat: input.budget_per_seat ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function getCohortHealth(cohortId: string): Promise<any> {
  const { data, error } = await supabase.rpc("cohort_health", { _cohort_id: cohortId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function markSessionAttendance(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_session_attendance", { _session_id: sessionId });
  if (error) throw error;
}

export async function getInstructorSessionAttendance<T = any>(sessionId: string): Promise<T[]> {
  const { data, error } = await supabase.rpc("instructor_session_attendance", { _session_id: sessionId });
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function getAuthoringTrends<T = any>(args: { instructorId: string; days: number }): Promise<T> {
  const { data, error } = await supabase.rpc("get_authoring_trends", {
    _instructor_id: args.instructorId,
    _days: args.days,
  });
  if (error) throw error;
  return data as T;
}

export async function getTrackProgress<T = any>(assignmentId: string): Promise<T> {
  const { data, error } = await supabase.rpc("get_track_progress", { p_assignment_id: assignmentId });
  if (error) throw error;
  return data as T;
}

export async function orgAssignTrack(input: {
  track_id: string;
  company_id: string;
  user_ids: string[];
  due_at?: string | null;
}): Promise<any> {
  const { data, error } = await supabase.rpc("org_assign_track", {
    p_track_id: input.track_id,
    p_company_id: input.company_id,
    p_user_ids: input.user_ids,
    p_due_at: input.due_at ?? null,
  });
  if (error) throw error;
  return data;
}


// ─── Phase 10j.5h8: hub, instructor, enrollment, readiness RPC wrappers ───
export async function getLearningHubDashboard<T = any>(): Promise<T> {
  const { data, error } = await supabase.rpc("get_learning_hub_dashboard");
  if (error) throw error;
  return data as T;
}

export async function getInstructorSummary<T = any>(): Promise<T> {
  const { data, error } = await supabase.rpc("get_instructor_summary");
  if (error) throw error;
  return data as T;
}

export async function enrollInContent<T = any>(args: {
  contentId: string;
  refCode: string | null;
}): Promise<T> {
  const { data, error } = await supabase.rpc("enroll_in_content" as any, {
    p_content_id: args.contentId,
    p_ref_code: args.refCode,
  });
  if (error) throw error;
  return data as T;
}

export async function recomputeContentReadiness(contentId: string) {
  const { error } = await supabase.rpc("recompute_content_readiness", { _content_id: contentId });
  if (error) throw error;
}

// ─── Phase 10j.5h9 ────────────────────────────────────────────────────────
export async function getInstructorDashboardV2<T = any>(): Promise<T | null> {
  const { data, error } = await supabase.rpc("get_instructor_dashboard_v2");
  if (error) throw error;
  return (data ?? null) as T | null;
}

export async function incrementContentEnrollment(rowId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_content_enrollment" as any, { row_id: rowId });
  if (error) throw error;
}

export async function incrementAccessCodeUse(rowId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_access_code_use" as any, { row_id: rowId });
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Storage helpers (Phase 10j.5i) — module resources (public)
// -----------------------------------------------------------------------------

export async function uploadModuleResource(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string; publicUrl: string }> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: options?.upsert ?? false, contentType: options?.contentType });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

// -----------------------------------------------------------------------------
// Storage helpers — assessment / IELTS audio (private buckets)
// -----------------------------------------------------------------------------

export async function uploadIeltsAudio(
  path: string,
  blob: Blob,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string }> {
  const { error } = await supabase.storage
    .from("ielts-audio")
    .upload(path, blob, { upsert: options?.upsert ?? false, contentType: options?.contentType });
  if (error) throw error;
  return { path };
}

export async function uploadAssessmentAudio(
  path: string,
  blob: Blob,
  options?: { upsert?: boolean; contentType?: string },
): Promise<{ path: string }> {
  const { error } = await supabase.storage
    .from("assessment-audio")
    .upload(path, blob, { upsert: options?.upsert ?? true, contentType: options?.contentType ?? "audio/webm" });
  if (error) throw error;
  return { path };
}

// -----------------------------------------------------------------------------
// Realtime helpers (Phase 10j.5k1) — discussion + Q&A CDC subscriptions
// -----------------------------------------------------------------------------

export function subscribeDiscussionPostsForCohort(cohortId: string, onChange: () => void): () => void {
  const ch = supabase
    .channel(`public:threads:${cohortId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "discussion_posts" }, () => onChange())
    .subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}

export function subscribeDiscussionPostsForThread(threadId: string, onChange: () => void): () => void {
  const ch = supabase
    .channel(`public:thread:${threadId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "discussion_posts", filter: `thread_id=eq.${threadId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}

export function subscribeLessonAnswers(
  contentId: string,
  itemId: string | undefined,
  onChange: () => void,
): () => void {
  const ch = supabase
    .channel(`public:qna:${contentId}:${itemId ?? "all"}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "lesson_answers" }, () => onChange())
    .subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}

// ─── Phase 10j.5k5: enrollment lookup + skill-credentials ────────────────
export async function findTalentEnrollment(
  contentId: string,
  talentId: string,
): Promise<{ id: string; status: string; enrolled_at: string; progress: number } | null> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, progress")
    .eq("content_id", contentId)
    .or(`talent_id.eq.${talentId},student_id.eq.${talentId}`)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function listTalentSkillCredentials(talentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("skill_credentials")
    .select("*, content:content_id(title, slug)")
    .eq("talent_id", talentId)
    .is("revoked_at", null)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Phase 10j.5k7 — resource progress / org learning ───────────────────
export async function getEnrollmentResourceState(
  enrollmentId: string,
  moduleId: string,
): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("enrollment_stage_progress")
    .select("resource_state")
    .eq("enrollment_id", enrollmentId)
    .eq("module_id", moduleId)
    .maybeSingle();
  if (error) throw error;
  return (data?.resource_state as Record<string, any>) ?? {};
}

export async function updateEnrollmentResourceState(
  enrollmentId: string,
  moduleId: string,
  payload: Record<string, any>,
): Promise<void> {
  const { error } = await supabase
    .from("enrollment_stage_progress")
    .update({ resource_state: payload as any })
    .eq("enrollment_id", enrollmentId)
    .eq("module_id", moduleId);
  if (error) throw error;
}

export async function listCompanyCourseAssignments(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_course_assignments")
    .select("*, content:content_id(id,title), cohort:cohort_id(id,name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCompanyLearningSeats(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("company_learning_seats")
    .select("*, content:content_id(id,title)")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []) as any[];
}
