/**
 * Typed response contracts for gigs-domain edge functions.
 * Request bodies kept permissive — call sites use snake_case payloads.
 */

export type AiBidCoachRequest = Record<string, unknown>;
export interface AiBidCoachResponse {
  suggestions?: string[];
  improved?: string;
  rationale?: string;
  error?: string;
  [k: string]: unknown;
}

export type GenerateOutreachMessageRequest = Record<string, unknown>;
export interface GenerateOutreachMessageResponse {
  message?: string;
  subject?: string;
  error?: string;
  [k: string]: unknown;
}

export type ParseJobPostRequest = Record<string, unknown>;
export interface ParseJobPostResponse {
  success?: boolean;
  parsed?: Record<string, unknown>;
  error?: string;
  [k: string]: unknown;
}

export type GenerateJobShareCaptionRequest = Record<string, unknown>;
export interface GenerateJobShareCaptionResponse {
  caption?: string;
  hashtags?: string[];
  error?: string;
  [k: string]: unknown;
}
