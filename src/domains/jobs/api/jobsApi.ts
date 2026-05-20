/**
 * Typed wrappers around jobs-domain edge functions (Phase 9d).
 *
 * Convention (locked in Phase 9b):
 *   - One async function per edge function — import by name.
 *   - No `*Api` const, no `<DOMAIN>_EDGE_FUNCTIONS` array.
 *   - Responses validated at runtime via `parseEdgeResponse`.
 *   - Failures throw `EdgeFunctionError`.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AnalyzeJobMarketResponseSchema,
  CronRebuildJobRecsResponseSchema,
  EnhanceJobDescriptionResponseSchema,
  GenerateJobShareCaptionResponseSchema,
  NotifyApplicationStatusResponseSchema,
  NotifyHiringEventResponseSchema,
  ParseCvResponseSchema,
  ParseJobPostResponseSchema,
  ScoreJobMatchResponseSchema,
  SuggestJobsForTalentResponseSchema,
  type AnalyzeJobMarketRequest,
  type AnalyzeJobMarketResponse,
  type CronRebuildJobRecsRequest,
  type CronRebuildJobRecsResponse,
  type EnhanceJobDescriptionRequest,
  type EnhanceJobDescriptionResponse,
  type GenerateJobShareCaptionRequest,
  type GenerateJobShareCaptionResponse,
  type NotifyApplicationStatusRequest,
  type NotifyApplicationStatusResponse,
  type NotifyHiringEventRequest,
  type NotifyHiringEventResponse,
  type ParseCvRequest,
  type ParseCvResponse,
  type ParseJobPostRequest,
  type ParseJobPostResponse,
  type ScoreJobMatchRequest,
  type ScoreJobMatchResponse,
  type SuggestJobsForTalentRequest,
  type SuggestJobsForTalentResponse,
} from "@/edge/contracts/jobs";

export async function scoreJobMatch(
  req: ScoreJobMatchRequest,
): Promise<ScoreJobMatchResponse> {
  const { data, error } = await supabase.functions.invoke("score-job-match", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("score-job-match", error);
  return parseEdgeResponse(
    "score-job-match",
    ScoreJobMatchResponseSchema,
    data ?? {},
  );
}

export async function suggestJobsForTalent(
  req: SuggestJobsForTalentRequest = {},
): Promise<SuggestJobsForTalentResponse> {
  const { data, error } = await supabase.functions.invoke(
    "suggest-jobs-for-talent",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("suggest-jobs-for-talent", error);
  return parseEdgeResponse(
    "suggest-jobs-for-talent",
    SuggestJobsForTalentResponseSchema,
    data ?? {},
  );
}

export async function cronRebuildJobRecs(
  req: CronRebuildJobRecsRequest = {},
): Promise<CronRebuildJobRecsResponse> {
  const { data, error } = await supabase.functions.invoke(
    "cron-rebuild-job-recs",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("cron-rebuild-job-recs", error);
  return parseEdgeResponse(
    "cron-rebuild-job-recs",
    CronRebuildJobRecsResponseSchema,
    data ?? {},
  );
}

export async function analyzeJobMarket(
  req: AnalyzeJobMarketRequest,
): Promise<AnalyzeJobMarketResponse> {
  const { data, error } = await supabase.functions.invoke(
    "analyze-job-market",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("analyze-job-market", error);
  return parseEdgeResponse(
    "analyze-job-market",
    AnalyzeJobMarketResponseSchema,
    data ?? {},
  );
}

export async function enhanceJobDescription(
  req: EnhanceJobDescriptionRequest,
): Promise<EnhanceJobDescriptionResponse> {
  const { data, error } = await supabase.functions.invoke(
    "enhance-job-description",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("enhance-job-description", error);
  return parseEdgeResponse(
    "enhance-job-description",
    EnhanceJobDescriptionResponseSchema,
    data ?? {},
  );
}

export async function parseCv(req: ParseCvRequest): Promise<ParseCvResponse> {
  const { data, error } = await supabase.functions.invoke("parse-cv", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("parse-cv", error);
  return parseEdgeResponse("parse-cv", ParseCvResponseSchema, data ?? {});
}

export async function parseJobPost(
  req: ParseJobPostRequest,
): Promise<ParseJobPostResponse> {
  const { data, error } = await supabase.functions.invoke("parse-job-post", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("parse-job-post", error);
  return parseEdgeResponse(
    "parse-job-post",
    ParseJobPostResponseSchema,
    data ?? {},
  );
}

export async function generateJobShareCaption(
  req: GenerateJobShareCaptionRequest,
): Promise<GenerateJobShareCaptionResponse> {
  const { data, error } = await supabase.functions.invoke(
    "generate-job-share-caption",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("generate-job-share-caption", error);
  return parseEdgeResponse(
    "generate-job-share-caption",
    GenerateJobShareCaptionResponseSchema,
    data ?? {},
  );
}

export async function notifyApplicationStatus(
  req: NotifyApplicationStatusRequest,
): Promise<NotifyApplicationStatusResponse> {
  const { data, error } = await supabase.functions.invoke(
    "notify-application-status",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("notify-application-status", error);
  return parseEdgeResponse(
    "notify-application-status",
    NotifyApplicationStatusResponseSchema,
    data ?? {},
  );
}

export async function notifyHiringEvent(
  req: NotifyHiringEventRequest,
): Promise<NotifyHiringEventResponse> {
  const { data, error } = await supabase.functions.invoke(
    "notify-hiring-event",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("notify-hiring-event", error);
  return parseEdgeResponse(
    "notify-hiring-event",
    NotifyHiringEventResponseSchema,
    data ?? {},
  );
}
