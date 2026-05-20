/**
 * Jobs domain — edge function contracts.
 *
 * Shells should call these via `jobsApi.*` wrappers (Phase 9). Today most
 * admin call sites still use `supabase.functions.invoke` directly; this file
 * documents the contract surface so the migration is mechanical.
 */

export interface EnhanceJobDescriptionRequest {
  title?: string;
  description: string;
  company?: string;
}
export type EnhanceJobDescriptionResponse = Record<string, unknown>;

export interface ScoreJobMatchRequest {
  applicationId?: string;
  jobId: string;
  talentId?: string;
}
export type ScoreJobMatchResponse = Record<string, unknown>;

export interface ParseCvRequest {
  file?: unknown;
  url?: string;
  text?: string;
}
export type ParseCvResponse = Record<string, unknown>;

export interface ParseJobPostRequest {
  url?: string;
  text?: string;
}
export type ParseJobPostResponse = Record<string, unknown>;

export interface GenerateJobShareCaptionRequest {
  jobId: string;
  channel?: string;
}
export type GenerateJobShareCaptionResponse = Record<string, unknown>;
