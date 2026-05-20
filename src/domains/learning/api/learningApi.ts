/**
 * Typed wrappers around learning-domain edge functions (Phase 9f).
 *
 * Convention (locked in Phase 9b):
 *   - One async function per edge function — import by name.
 *   - No `*Api` const, no `<DOMAIN>_EDGE_FUNCTIONS` array.
 *   - Responses validated at runtime via `parseEdgeResponse`.
 *   - Failures throw `EdgeFunctionError`.
 *
 * Postgres RPCs (`get_tutor_mastery_context`, `get_track_progress`,
 * `org_learning_health`) are NOT wrapped here — call them via
 * `supabase.rpc()` directly from their owning hooks.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AiInstructorChatResponseSchema,
  AiItemApplyResponseSchema,
  AiItemRewriteResponseSchema,
  AiItemTranslateApplyResponseSchema,
  AiItemTranslateResponseSchema,
  AuthoringReviewDigestResponseSchema,
  CreateInstructorJobFromBriefResponseSchema,
  InstructorItemAnalyticsResponseSchema,
  IssueSkillCredentialsResponseSchema,
  LearnerAdaptiveSampleResponseSchema,
  LearnerMasterySummaryResponseSchema,
  LearnerNextActionsResponseSchema,
  LearnerQuizPoolResponseSchema,
  LearnerReviewQueueResponseSchema,
  LearnerScenarioEvaluateResponseSchema,
  LearnerScenarioPoolResponseSchema,
  LearnerTalentMirrorResponseSchema,
  type AiInstructorChatRequest,
  type AiInstructorChatResponse,
  type AiItemApplyRequest,
  type AiItemApplyResponse,
  type AiItemRewriteRequest,
  type AiItemRewriteResponse,
  type AiItemTranslateApplyRequest,
  type AiItemTranslateApplyResponse,
  type AiItemTranslateRequest,
  type AiItemTranslateResponse,
  type AuthoringReviewDigestRequest,
  type AuthoringReviewDigestResponse,
  type CreateInstructorJobFromBriefRequest,
  type CreateInstructorJobFromBriefResponse,
  type InstructorItemAnalyticsRequest,
  type InstructorItemAnalyticsResponse,
  type IssueSkillCredentialsRequest,
  type IssueSkillCredentialsResponse,
  type LearnerAdaptiveSampleRequest,
  type LearnerAdaptiveSampleResponse,
  type LearnerMasterySummaryRequest,
  type LearnerMasterySummaryResponse,
  type LearnerNextActionsRequest,
  type LearnerNextActionsResponse,
  type LearnerQuizPoolRequest,
  type LearnerQuizPoolResponse,
  type LearnerReviewQueueRequest,
  type LearnerReviewQueueResponse,
  type LearnerScenarioEvaluateRequest,
  type LearnerScenarioEvaluateResponse,
  type LearnerScenarioPoolRequest,
  type LearnerScenarioPoolResponse,
  type LearnerTalentMirrorRequest,
  type LearnerTalentMirrorResponse,
} from "@/edge/contracts/learning";

export async function aiInstructorChat(
  req: AiInstructorChatRequest,
): Promise<AiInstructorChatResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-instructor-chat",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-instructor-chat", error);
  return parseEdgeResponse(
    "ai-instructor-chat",
    AiInstructorChatResponseSchema,
    data ?? {},
  );
}

export async function aiItemRewrite(
  req: AiItemRewriteRequest,
): Promise<AiItemRewriteResponse> {
  const { data, error } = await supabase.functions.invoke("ai-item-rewrite", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-item-rewrite", error);
  return parseEdgeResponse(
    "ai-item-rewrite",
    AiItemRewriteResponseSchema,
    data ?? {},
  );
}

export async function aiItemApply(
  req: AiItemApplyRequest,
): Promise<AiItemApplyResponse> {
  const { data, error } = await supabase.functions.invoke("ai-item-apply", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-item-apply", error);
  return parseEdgeResponse(
    "ai-item-apply",
    AiItemApplyResponseSchema,
    data ?? {},
  );
}

export async function aiItemTranslate(
  req: AiItemTranslateRequest,
): Promise<AiItemTranslateResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-item-translate",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-item-translate", error);
  return parseEdgeResponse(
    "ai-item-translate",
    AiItemTranslateResponseSchema,
    data ?? {},
  );
}

export async function aiItemTranslateApply(
  req: AiItemTranslateApplyRequest,
): Promise<AiItemTranslateApplyResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-item-translate-apply",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-item-translate-apply", error);
  return parseEdgeResponse(
    "ai-item-translate-apply",
    AiItemTranslateApplyResponseSchema,
    data ?? {},
  );
}

export async function instructorItemAnalytics(
  req: InstructorItemAnalyticsRequest,
): Promise<InstructorItemAnalyticsResponse> {
  const { data, error } = await supabase.functions.invoke(
    "instructor-item-analytics",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("instructor-item-analytics", error);
  return parseEdgeResponse(
    "instructor-item-analytics",
    InstructorItemAnalyticsResponseSchema,
    data ?? {},
  );
}

export async function authoringReviewDigest(
  req: AuthoringReviewDigestRequest,
): Promise<AuthoringReviewDigestResponse> {
  const { data, error } = await supabase.functions.invoke(
    "authoring-review-digest",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("authoring-review-digest", error);
  return parseEdgeResponse(
    "authoring-review-digest",
    AuthoringReviewDigestResponseSchema,
    data ?? {},
  );
}

export async function learnerNextActions(
  req: LearnerNextActionsRequest = {},
): Promise<LearnerNextActionsResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-next-actions",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-next-actions", error);
  return parseEdgeResponse(
    "learner-next-actions",
    LearnerNextActionsResponseSchema,
    data ?? {},
  );
}

export async function learnerTalentMirror(
  req: LearnerTalentMirrorRequest = {},
): Promise<LearnerTalentMirrorResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-talent-mirror",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-talent-mirror", error);
  return parseEdgeResponse(
    "learner-talent-mirror",
    LearnerTalentMirrorResponseSchema,
    data ?? {},
  );
}

export async function learnerMasterySummary(
  req: LearnerMasterySummaryRequest = {},
): Promise<LearnerMasterySummaryResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-mastery-summary",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-mastery-summary", error);
  return parseEdgeResponse(
    "learner-mastery-summary",
    LearnerMasterySummaryResponseSchema,
    data ?? {},
  );
}

export async function learnerReviewQueue(
  req: LearnerReviewQueueRequest = {},
): Promise<LearnerReviewQueueResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-review-queue",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-review-queue", error);
  return parseEdgeResponse(
    "learner-review-queue",
    LearnerReviewQueueResponseSchema,
    data ?? {},
  );
}

export async function learnerQuizPool(
  req: LearnerQuizPoolRequest,
): Promise<LearnerQuizPoolResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-quiz-pool",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-quiz-pool", error);
  return parseEdgeResponse(
    "learner-quiz-pool",
    LearnerQuizPoolResponseSchema,
    data ?? {},
  );
}

export async function learnerScenarioPool(
  req: LearnerScenarioPoolRequest,
): Promise<LearnerScenarioPoolResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-scenario-pool",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-scenario-pool", error);
  return parseEdgeResponse(
    "learner-scenario-pool",
    LearnerScenarioPoolResponseSchema,
    data ?? {},
  );
}

export async function learnerScenarioEvaluate(
  req: LearnerScenarioEvaluateRequest,
): Promise<LearnerScenarioEvaluateResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-scenario-evaluate",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-scenario-evaluate", error);
  return parseEdgeResponse(
    "learner-scenario-evaluate",
    LearnerScenarioEvaluateResponseSchema,
    data ?? {},
  );
}

export async function learnerAdaptiveSample(
  req: LearnerAdaptiveSampleRequest,
): Promise<LearnerAdaptiveSampleResponse> {
  const { data, error } = await supabase.functions.invoke(
    "learner-adaptive-sample",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("learner-adaptive-sample", error);
  return parseEdgeResponse(
    "learner-adaptive-sample",
    LearnerAdaptiveSampleResponseSchema,
    data ?? {},
  );
}

export async function issueSkillCredentials(
  req: IssueSkillCredentialsRequest = {},
): Promise<IssueSkillCredentialsResponse> {
  const { data, error } = await supabase.functions.invoke(
    "issue-skill-credentials",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("issue-skill-credentials", error);
  return parseEdgeResponse(
    "issue-skill-credentials",
    IssueSkillCredentialsResponseSchema,
    data ?? {},
  );
}

export async function createInstructorJobFromBrief(
  req: CreateInstructorJobFromBriefRequest,
): Promise<CreateInstructorJobFromBriefResponse> {
  const { data, error } = await supabase.functions.invoke(
    "create-instructor-job-from-brief",
    { body: req },
  );
  if (error)
    throw new EdgeFunctionError("create-instructor-job-from-brief", error);
  return parseEdgeResponse(
    "create-instructor-job-from-brief",
    CreateInstructorJobFromBriefResponseSchema,
    data ?? {},
  );
}
