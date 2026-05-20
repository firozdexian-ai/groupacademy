/**
 * Jobs domain — edge function contracts (Phase 9d).
 *
 * Mirrors the talent/agents convention: per-function Request type +
 * Zod Response schema with `.passthrough()`. Request shapes preserve
 * runtime behavior of in-domain call sites; drift between call sites
 * and edge functions (e.g. camelCase vs snake_case) is documented in
 * `.lovable/known-edge-contract-drift.md`.
 */
import { z } from "zod";

// score-job-match ------------------------------------------------------------
export interface ScoreJobMatchRequest {
  /** All in-domain call sites send camelCase. The edge function also accepts
   *  snake_case; both keys are passed through. */
  jobId?: string;
  talentId?: string;
  job_id?: string;
  talent_id?: string;
  applicationId?: string;
  [k: string]: unknown;
}

export const ScoreJobMatchResponseSchema = z
  .object({
    overall_match: z.number().optional(),
    score: z.number().optional(),
    match_score: z.number().optional(),
    recommendation: z.string().optional(),
    rationale: z.string().optional(),
    verified_match: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type ScoreJobMatchResponse = z.infer<typeof ScoreJobMatchResponseSchema>;

// suggest-jobs-for-talent ----------------------------------------------------
export interface SuggestJobsForTalentRequest {
  talent_id?: string;
  limit?: number;
}

export const SuggestJobsForTalentResponseSchema = z
  .object({
    jobs: z.array(z.unknown()).optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type SuggestJobsForTalentResponse = z.infer<
  typeof SuggestJobsForTalentResponseSchema
>;

// cron-rebuild-job-recs ------------------------------------------------------
export interface CronRebuildJobRecsRequest {
  talent_id?: string;
}

export const CronRebuildJobRecsResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    rebuilt: z.number().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type CronRebuildJobRecsResponse = z.infer<
  typeof CronRebuildJobRecsResponseSchema
>;

// analyze-job-market ---------------------------------------------------------
export interface AnalyzeJobMarketRequest {
  jobId: string;
}

export const AnalyzeJobMarketResponseSchema = z
  .object({
    market_summary: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AnalyzeJobMarketResponse = z.infer<
  typeof AnalyzeJobMarketResponseSchema
>;

// enhance-job-description ----------------------------------------------------
export interface EnhanceJobDescriptionRequest {
  title?: string;
  description: string;
  company?: string;
}

export const EnhanceJobDescriptionResponseSchema = z
  .object({
    enhanced: z.string().optional(),
    description: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type EnhanceJobDescriptionResponse = z.infer<
  typeof EnhanceJobDescriptionResponseSchema
>;

// parse-cv -------------------------------------------------------------------
export interface ParseCvRequest {
  cvText?: string;
  fileUrl?: string;
  serviceType?: string;
  [k: string]: unknown;
}

export const ParseCvResponseSchema = z
  .object({
    parsed: z.unknown().optional(),
    cv_data: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type ParseCvResponse = z.infer<typeof ParseCvResponseSchema>;

// parse-job-post -------------------------------------------------------------
export interface ParseJobPostRequest {
  url?: string;
  text?: string;
}

export const ParseJobPostResponseSchema = z
  .object({
    parsed_job: z.unknown().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type ParseJobPostResponse = z.infer<typeof ParseJobPostResponseSchema>;

// generate-job-share-caption -------------------------------------------------
export interface GenerateJobShareCaptionRequest {
  title?: string;
  company?: string;
  location?: string;
  job_type?: string;
  apply_link?: string;
  channel?: string;
  jobId?: string;
  [k: string]: unknown;
}

export const GenerateJobShareCaptionResponseSchema = z
  .object({
    caption: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type GenerateJobShareCaptionResponse = z.infer<
  typeof GenerateJobShareCaptionResponseSchema
>;

// notify-application-status --------------------------------------------------
export interface NotifyApplicationStatusRequest {
  application_id: string;
  status?: string;
  new_status?: string;
}

export const NotifyApplicationStatusResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type NotifyApplicationStatusResponse = z.infer<
  typeof NotifyApplicationStatusResponseSchema
>;

// notify-hiring-event --------------------------------------------------------
export interface NotifyHiringEventRequest {
  kind: string;
  ref: Record<string, unknown>;
  [k: string]: unknown;
}

export const NotifyHiringEventResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type NotifyHiringEventResponse = z.infer<
  typeof NotifyHiringEventResponseSchema
>;
