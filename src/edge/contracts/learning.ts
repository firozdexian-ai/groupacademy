/**
 * Learning domain — edge function contracts (Phase 9f).
 *
 * Per-function Request interface + Zod Response schema with
 * `.passthrough()`. Request shapes mirror real in-domain call sites;
 * any drift is documented in `.lovable/known-edge-contract-drift.md`.
 *
 * Note: `get_tutor_mastery_context`, `get_track_progress`, and
 * `org_learning_health` are Postgres RPCs (called via `supabase.rpc()`),
 * not edge functions — they are intentionally NOT modeled here.
 */
import { z } from "zod";

// ---------- ai-instructor-chat ----------
export interface AiInstructorChatRequest {
  message?: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  course_id?: string;
  module_id?: string;
  thread_id?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  [k: string]: unknown;
}

export const AiInstructorChatResponseSchema = z
  .object({
    reply: z.string().optional(),
    thread_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiInstructorChatResponse = z.infer<
  typeof AiInstructorChatResponseSchema
>;

// ---------- ai-item-rewrite ----------
export interface AiItemRewriteRequest {
  kind?: string;
  item_id: string;
  instruction?: string;
  flags?: unknown;
  notes?: string;
  [k: string]: unknown;
}

export const AiItemRewriteResponseSchema = z
  .object({
    suggestion: z.record(z.unknown()).optional(),
    rationale: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiItemRewriteResponse = z.infer<
  typeof AiItemRewriteResponseSchema
>;

// ---------- ai-item-apply ----------
export interface AiItemApplyRequest {
  kind?: string;
  item_id: string;
  suggestion?: Record<string, unknown>;
  patch?: unknown;
  flags_addressed?: unknown;
  [k: string]: unknown;
}

export const AiItemApplyResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    item_id: z.string().optional(),
    revision_id: z.string().nullable().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiItemApplyResponse = z.infer<typeof AiItemApplyResponseSchema>;

// ---------- ai-item-translate ----------
export interface AiItemTranslateRequest {
  item_id: string;
  item_type?: string;
  target_language?: string;
  target_lang?: string;
  [k: string]: unknown;
}

export const AiItemTranslateResponseSchema = z
  .object({
    item_id: z.string().optional(),
    target_lang: z.string().optional(),
    language_code: z.string().optional(),
    translation: z.record(z.unknown()).optional(),
    payload: z.record(z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiItemTranslateResponse = z.infer<
  typeof AiItemTranslateResponseSchema
>;

// ---------- ai-item-translate-apply ----------
export interface AiItemTranslateApplyRequest {
  item_id: string;
  item_type: string;
  language_code: string;
  payload: Record<string, unknown>;
  source?: string;
  [k: string]: unknown;
}

export const AiItemTranslateApplyResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiItemTranslateApplyResponse = z.infer<
  typeof AiItemTranslateApplyResponseSchema
>;

// ---------- instructor-item-analytics ----------
export interface InstructorItemAnalyticsRequest {
  module_id?: string;
  course_id?: string;
  days?: number;
  [k: string]: unknown;
}

export const InstructorItemAnalyticsResponseSchema = z
  .object({
    items: z.array(z.record(z.unknown())).optional(),
    topic_mastery: z.array(z.record(z.unknown())).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type InstructorItemAnalyticsResponse = z.infer<
  typeof InstructorItemAnalyticsResponseSchema
>;

// ---------- authoring-review-digest ----------
export interface AuthoringReviewDigestRequest {
  mode: "single" | "course" | "weekly";
  module_id?: string;
  course_id?: string;
  days?: number;
  [k: string]: unknown;
}

export const AuthoringReviewDigestResponseSchema = z
  .object({
    digest: z.record(z.unknown()).optional(),
    summary: z.record(z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AuthoringReviewDigestResponse = z.infer<
  typeof AuthoringReviewDigestResponseSchema
>;

// ---------- learner-next-actions ----------
export interface LearnerNextActionsRequest {
  talent_id?: string;
  limit?: number;
  [k: string]: unknown;
}

export const LearnerNextActionsResponseSchema = z
  .object({
    actions: z
      .array(
        z
          .object({
            kind: z.string(),
            ref_id: z.string().optional(),
            reason: z.string().optional(),
            score: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerNextActionsResponse = z.infer<
  typeof LearnerNextActionsResponseSchema
>;

// ---------- learner-talent-mirror ----------
export interface LearnerTalentMirrorRequest {
  talent_id?: string;
  [k: string]: unknown;
}

export const LearnerTalentMirrorResponseSchema = z
  .object({
    rollup: z.array(z.record(z.unknown())).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerTalentMirrorResponse = z.infer<
  typeof LearnerTalentMirrorResponseSchema
>;

// ---------- learner-mastery-summary ----------
export interface LearnerMasterySummaryRequest {
  module_id?: string;
  content_id?: string;
  days?: number;
  [k: string]: unknown;
}

export const LearnerMasterySummaryResponseSchema = z
  .object({
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerMasterySummaryResponse = z.infer<
  typeof LearnerMasterySummaryResponseSchema
>;

// ---------- learner-review-queue ----------
export interface LearnerReviewQueueRequest {
  limit?: number;
  items_per_topic?: number;
  module_id?: string;
  include_upcoming?: boolean;
  [k: string]: unknown;
}

export const LearnerReviewQueueResponseSchema = z
  .object({
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerReviewQueueResponse = z.infer<
  typeof LearnerReviewQueueResponseSchema
>;

// ---------- learner-quiz-pool ----------
export interface LearnerQuizPoolRequest {
  mode: "draw" | "submit" | string;
  module_id?: string;
  item_ids?: string[];
  answers?: unknown;
  [k: string]: unknown;
}

export const LearnerQuizPoolResponseSchema = z
  .object({
    items: z.array(z.record(z.unknown())).optional(),
    score: z.number().optional(),
    results: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerQuizPoolResponse = z.infer<
  typeof LearnerQuizPoolResponseSchema
>;

// ---------- learner-scenario-pool ----------
export interface LearnerScenarioPoolRequest {
  mode: "draw" | "create_run" | string;
  module_id?: string;
  scenario_id?: string;
  conversation?: unknown;
  [k: string]: unknown;
}

export const LearnerScenarioPoolResponseSchema = z
  .object({
    scenario: z.record(z.unknown()).optional(),
    run_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerScenarioPoolResponse = z.infer<
  typeof LearnerScenarioPoolResponseSchema
>;

// ---------- learner-scenario-evaluate ----------
export interface LearnerScenarioEvaluateRequest {
  run_id: string;
  [k: string]: unknown;
}

export const LearnerScenarioEvaluateResponseSchema = z
  .object({
    evaluation: z.record(z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerScenarioEvaluateResponse = z.infer<
  typeof LearnerScenarioEvaluateResponseSchema
>;

// ---------- learner-adaptive-sample ----------
export interface LearnerAdaptiveSampleRequest {
  module_id?: string;
  count?: number;
  [k: string]: unknown;
}

export const LearnerAdaptiveSampleResponseSchema = z
  .object({
    items: z.array(z.record(z.unknown())).optional(),
    avg_mastery: z.number().optional(),
    mix: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type LearnerAdaptiveSampleResponse = z.infer<
  typeof LearnerAdaptiveSampleResponseSchema
>;

// ---------- issue-skill-credentials ----------
export interface IssueSkillCredentialsRequest {
  talent_id?: string;
  [k: string]: unknown;
}

export const IssueSkillCredentialsResponseSchema = z
  .object({
    newly_issued: z.array(z.unknown()).optional(),
    evaluated: z.number().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type IssueSkillCredentialsResponse = z.infer<
  typeof IssueSkillCredentialsResponseSchema
>;

// ---------- create-instructor-job-from-brief ----------
export interface CreateInstructorJobFromBriefRequest {
  brief_id: string;
  [k: string]: unknown;
}

export const CreateInstructorJobFromBriefResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    job_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type CreateInstructorJobFromBriefResponse = z.infer<
  typeof CreateInstructorJobFromBriefResponseSchema
>;
