/**
 * Abroad domain — edge function contracts (Phase 9e).
 *
 * Mirrors the talent/agents/jobs convention: per-function Request type
 * (plain interface) + Zod Response schema with `.passthrough()`. Request
 * shapes preserve runtime behavior of current call sites; any drift is
 * documented in `.lovable/known-edge-contract-drift.md`.
 */
import { z } from "zod";

// ai-destination-agent -------------------------------------------------------
/**
 * Used by `DestinationAgentPage` (chat intent) and `RoadmapBuilderSheet`
 * (roadmap intent w/ `roadmap_payload`). Both flows hit the same edge
 * function with different `intent` discriminators.
 */
export interface AiDestinationAgentRequest {
  country_code?: string;
  countryCode?: string;
  intent?: "chat" | "roadmap" | string;
  message?: string;
  roadmap_payload?: Record<string, unknown>;
  [k: string]: unknown;
}

export const AiDestinationAgentResponseSchema = z
  .object({
    message: z.string().optional(),
    reply: z.string().optional(),
    roadmap_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiDestinationAgentResponse = z.infer<
  typeof AiDestinationAgentResponseSchema
>;

// generate-study-roadmap -----------------------------------------------------
/**
 * `RoadmapIntakeForm` sends a fully-camelCased intake payload. Edge fn
 * accepts both spellings; index signature keeps either form valid.
 */
export interface GenerateStudyRoadmapRequest {
  roadmapId?: string;
  roadmap_id?: string;
  targetCountries?: string[];
  degreeLevel?: string;
  fieldOfStudy?: string;
  targetIntake?: string;
  budgetLevel?: string;
  ieltsScore?: number | null;
  fullName?: string;
  email?: string;
  currentProfession?: string;
  currentSkills?: unknown[];
  originCountry?: string;
  yearsExperience?: number;
  [k: string]: unknown;
}

export const GenerateStudyRoadmapResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    roadmap_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type GenerateStudyRoadmapResponse = z.infer<
  typeof GenerateStudyRoadmapResponseSchema
>;

// book-language-session ------------------------------------------------------
export interface BookLanguageSessionRequest {
  instructor_user_id: string;
  language_code: string;
  scheduled_at: string;
  duration_mins: number;
  [k: string]: unknown;
}

export const BookLanguageSessionResponseSchema = z
  .object({
    ok: z.boolean().optional(),
    session_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type BookLanguageSessionResponse = z.infer<
  typeof BookLanguageSessionResponseSchema
>;

// ai-language-partner --------------------------------------------------------
export interface AiLanguagePartnerRequest {
  language_code: string;
  cefr_level: string;
  message: string;
  session_id?: string | null;
  [k: string]: unknown;
}

export const AiLanguagePartnerResponseSchema = z
  .object({
    reply: z.string().optional(),
    translation_en: z.string().optional(),
    corrections: z.array(z.unknown()).optional(),
    session_id: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiLanguagePartnerResponse = z.infer<
  typeof AiLanguagePartnerResponseSchema
>;

// ai-ielts-evaluate ----------------------------------------------------------
export interface AiIeltsEvaluateRequest {
  section: string;
  prompt_id: string;
  response_text?: string;
  audio_path?: string | null;
  [k: string]: unknown;
}

export const AiIeltsEvaluateResponseSchema = z
  .object({
    band: z.number().optional(),
    attempt_id: z.string().optional(),
    was_free: z.boolean().optional(),
    credits_spent: z.number().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type AiIeltsEvaluateResponse = z.infer<
  typeof AiIeltsEvaluateResponseSchema
>;
