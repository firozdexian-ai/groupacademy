/**
 * Barrel — re-exports learning edge wrappers + contract types.
 * Phase 9f: legacy `learningApi` const removed.
 *
 * Postgres RPCs (`get_tutor_mastery_context`, `get_track_progress`,
 * `org_learning_health`) are intentionally NOT exported here — they are
 * called via `supabase.rpc()` from their owning hooks.
 */
export {
  aiInstructorChat,
  aiItemApply,
  aiItemRewrite,
  aiItemTranslate,
  aiItemTranslateApply,
  authoringReviewDigest,
  createInstructorJobFromBrief,
  instructorItemAnalytics,
  issueSkillCredentials,
  learnerAdaptiveSample,
  learnerMasterySummary,
  learnerNextActions,
  learnerQuizPool,
  learnerReviewQueue,
  learnerScenarioEvaluate,
  learnerScenarioPool,
  learnerTalentMirror,
} from "./learningApi";

export type {
  AiInstructorChatRequest,
  AiInstructorChatResponse,
  AiItemApplyRequest,
  AiItemApplyResponse,
  AiItemRewriteRequest,
  AiItemRewriteResponse,
  AiItemTranslateApplyRequest,
  AiItemTranslateApplyResponse,
  AiItemTranslateRequest,
  AiItemTranslateResponse,
  AuthoringReviewDigestRequest,
  AuthoringReviewDigestResponse,
  CreateInstructorJobFromBriefRequest,
  CreateInstructorJobFromBriefResponse,
  InstructorItemAnalyticsRequest,
  InstructorItemAnalyticsResponse,
  IssueSkillCredentialsRequest,
  IssueSkillCredentialsResponse,
  LearnerAdaptiveSampleRequest,
  LearnerAdaptiveSampleResponse,
  LearnerMasterySummaryRequest,
  LearnerMasterySummaryResponse,
  LearnerNextActionsRequest,
  LearnerNextActionsResponse,
  LearnerQuizPoolRequest,
  LearnerQuizPoolResponse,
  LearnerReviewQueueRequest,
  LearnerReviewQueueResponse,
  LearnerScenarioEvaluateRequest,
  LearnerScenarioEvaluateResponse,
  LearnerScenarioPoolRequest,
  LearnerScenarioPoolResponse,
  LearnerTalentMirrorRequest,
  LearnerTalentMirrorResponse,
} from "@/edge/contracts/learning";
