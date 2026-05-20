// Typed edge function contracts for the abroad domain.

export interface AiDestinationAgentRequest {
  countryCode?: string;
  message?: string;
  [key: string]: unknown;
}
export type AiDestinationAgentResponse = Record<string, unknown>;

export interface GenerateStudyRoadmapRequest {
  [key: string]: unknown;
}
export type GenerateStudyRoadmapResponse = Record<string, unknown>;
