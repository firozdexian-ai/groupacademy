/**
 * Request/response contracts for the Learning domain's edge functions.
 *
 * These are intentionally loose (Record-based) at this stage of the migration —
 * they exist so callers stop importing edge function *names* directly and start
 * importing typed call signatures. As individual edge functions get strict
 * input/output schemas, replace the matching pair here.
 */

// ---------- Tutor / mastery ----------
export interface AiInstructorChatRequest {
  message: string;
  course_id?: string;
  module_id?: string;
  thread_id?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}
export interface AiInstructorChatResponse {
  reply: string;
  thread_id?: string;
  [k: string]: unknown;
}

export interface GetTutorMasteryContextRequest {
  talent_id?: string;
  course_id?: string;
}
export interface GetTutorMasteryContextResponse {
  weak_topics: Array<{ topic_id: string; topic: string; mastery: number }>;
  strong_topics: Array<{ topic_id: string; topic: string; mastery: number }>;
  credentials: Array<{ code: string; topic: string; tier: string }>;
  [k: string]: unknown;
}

// ---------- Authoring / item bank ----------
export interface AiItemRewriteRequest {
  item_id: string;
  instruction?: string;
}
export interface AiItemRewriteResponse {
  suggestion: Record<string, unknown>;
  rationale?: string;
}

export interface AiItemApplyRequest {
  item_id: string;
  suggestion: Record<string, unknown>;
}
export interface AiItemApplyResponse {
  ok: true;
  item_id: string;
}

export interface AiItemTranslateRequest {
  item_id: string;
  target_lang: string;
}
export interface AiItemTranslateResponse {
  item_id: string;
  target_lang: string;
  translation: Record<string, unknown>;
}

export interface InstructorItemAnalyticsRequest {
  module_id?: string;
  course_id?: string;
}
export interface InstructorItemAnalyticsResponse {
  items: Array<Record<string, unknown>>;
  topic_mastery: Array<Record<string, unknown>>;
}

export interface AuthoringReviewDigestRequest {
  mode: "single" | "course" | "weekly";
  module_id?: string;
  course_id?: string;
}
export interface AuthoringReviewDigestResponse {
  digest: Record<string, unknown>;
}

// ---------- Learner-facing ----------
export interface LearnerNextActionsRequest {
  talent_id?: string;
  limit?: number;
}
export interface LearnerNextActionsResponse {
  actions: Array<{ kind: string; ref_id: string; reason?: string; score?: number }>;
}

export interface LearnerTalentMirrorRequest {
  talent_id?: string;
}
export interface LearnerTalentMirrorResponse {
  rollup: Array<Record<string, unknown>>;
}

// ---------- Tracks / cohorts / orgs ----------
export interface GetTrackProgressRequest {
  track_id: string;
  talent_id?: string;
}
export interface GetTrackProgressResponse {
  progress: number;
  items: Array<Record<string, unknown>>;
}

export interface OrgLearningHealthRequest {
  company_id: string;
}
export interface OrgLearningHealthResponse {
  active: number;
  overdue: number;
  seats_used: number;
  seats_total: number;
  [k: string]: unknown;
}
