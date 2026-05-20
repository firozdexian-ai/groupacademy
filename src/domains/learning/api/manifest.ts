/**
 * Typed edge-function client surface for the Learning domain.
 * Wraps `supabase.functions.invoke` so UI never references function names directly.
 *
 * Request/response shapes live in `@/edge/contracts/learning`. Update those
 * contracts when an underlying edge function changes — `tsc` will then flag
 * every caller in the domain.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AiInstructorChatRequest,
  AiInstructorChatResponse,
  AiItemApplyRequest,
  AiItemApplyResponse,
  AiItemRewriteRequest,
  AiItemRewriteResponse,
  AiItemTranslateRequest,
  AiItemTranslateResponse,
  AuthoringReviewDigestRequest,
  AuthoringReviewDigestResponse,
  GetTrackProgressRequest,
  GetTrackProgressResponse,
  GetTutorMasteryContextRequest,
  GetTutorMasteryContextResponse,
  InstructorItemAnalyticsRequest,
  InstructorItemAnalyticsResponse,
  LearnerAdaptiveSampleRequest,
  LearnerAdaptiveSampleResponse,
  LearnerNextActionsRequest,
  LearnerNextActionsResponse,
  LearnerQuizPoolRequest,
  LearnerQuizPoolResponse,
  LearnerScenarioEvaluateRequest,
  LearnerScenarioEvaluateResponse,
  LearnerScenarioPoolRequest,
  LearnerScenarioPoolResponse,
  LearnerTalentMirrorRequest,
  LearnerTalentMirrorResponse,
  OrgLearningHealthRequest,
  OrgLearningHealthResponse,
} from "@/edge/contracts/learning";

async function invoke<TReq, TRes>(name: string, body?: TReq): Promise<TRes> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> | undefined });
  if (error) throw error;
  return data as TRes;
}

export const learningApi = {
  // Tutor / mastery
  tutorChat: (body: AiInstructorChatRequest) =>
    invoke<AiInstructorChatRequest, AiInstructorChatResponse>("ai-instructor-chat", body),
  tutorMastery: (body: GetTutorMasteryContextRequest) =>
    invoke<GetTutorMasteryContextRequest, GetTutorMasteryContextResponse>("get_tutor_mastery_context", body),

  // Authoring & item bank
  itemRewrite: (body: AiItemRewriteRequest) =>
    invoke<AiItemRewriteRequest, AiItemRewriteResponse>("ai-item-rewrite", body),
  itemRewriteApply: (body: AiItemApplyRequest) =>
    invoke<AiItemApplyRequest, AiItemApplyResponse>("ai-item-apply", body),
  itemTranslate: (body: AiItemTranslateRequest) =>
    invoke<AiItemTranslateRequest, AiItemTranslateResponse>("ai-item-translate", body),
  itemAnalytics: (body: InstructorItemAnalyticsRequest) =>
    invoke<InstructorItemAnalyticsRequest, InstructorItemAnalyticsResponse>("instructor-item-analytics", body),
  authoringDigest: (body: AuthoringReviewDigestRequest) =>
    invoke<AuthoringReviewDigestRequest, AuthoringReviewDigestResponse>("authoring-review-digest", body),

  // Learner-facing
  nextActions: (body: LearnerNextActionsRequest) =>
    invoke<LearnerNextActionsRequest, LearnerNextActionsResponse>("learner-next-actions", body),
  talentMirror: (body: LearnerTalentMirrorRequest) =>
    invoke<LearnerTalentMirrorRequest, LearnerTalentMirrorResponse>("learner-talent-mirror", body),

  // Tracks / cohorts / orgs
  trackProgress: (body: GetTrackProgressRequest) =>
    invoke<GetTrackProgressRequest, GetTrackProgressResponse>("get_track_progress", body),
  orgLearningHealth: (body: OrgLearningHealthRequest) =>
    invoke<OrgLearningHealthRequest, OrgLearningHealthResponse>("org_learning_health", body),
};

export type LearningApi = typeof learningApi;
