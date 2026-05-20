/**
 * Barrel — re-exports abroad edge wrappers + contract types.
 * Phase 9e: legacy `abroadApi` const removed.
 */
export {
  aiDestinationAgent,
  aiIeltsEvaluate,
  aiLanguagePartner,
  bookLanguageSession,
  generateStudyRoadmap,
} from "./abroadApi";

export type {
  AiDestinationAgentRequest,
  AiDestinationAgentResponse,
  AiIeltsEvaluateRequest,
  AiIeltsEvaluateResponse,
  AiLanguagePartnerRequest,
  AiLanguagePartnerResponse,
  BookLanguageSessionRequest,
  BookLanguageSessionResponse,
  GenerateStudyRoadmapRequest,
  GenerateStudyRoadmapResponse,
} from "@/edge/contracts/abroad";
