/**
 * Group Academy — Abroad Domain Export Engine (Barrel)
 * Version: Phase 10i.2 Hardened (Production Candidate)
 * Purpose: Single source of truth interface for public domain surfaces.
 * Constraints: Blocks implicit leaks, handles strict type barriers, strips internal metrics.
 */

// ─── STAGE 1: EDGE NETWORK LAYER WRAPPERS (API) ───────────────────────────
export {
  aiDestinationAgent,
  aiIeltsEvaluate,
  aiLanguagePartner,
  bookLanguageSession,
  generateStudyRoadmap,
} from "./abroadApi";

// ─── STAGE 2: HARDENED POSTGRES INFRASTRUCTURE (REPO) ─────────────────────
export {
  upsertGraphRow,
  deleteGraphRow,
  getAbroadGraphMaster,
  insertRoadmapContactLead,
  insertStudyAbroadRoadmap,
  getActiveCounsellorByUser,
  listAbroadApplications,
  getStudyAbroadProgramById,
  getStudyAbroadRoadmapById,
  advanceAbroadStage,
  listActiveStudyAbroadPrograms,
  listActiveDestinationAgents,
  getDestinationAgentByCountry,
  listActiveProgramsForCountry,
  listDestinationAgentMessages,
  getIeltsStreakByUser,
  listRecentIeltsMockAttempts,
  getIeltsDailyChallenge,
  listIeltsResourceAccessByTalent,
  listActiveIeltsResourcesBySection,
  listActiveLanguageInstructorsByCode,
  listAbroadApplicationsForCurrentUser,
} from "./abroadRepo";

// ─── STAGE 3: BOUND INTEGRATION SCHEMA TYPE DEFINITIONS ───────────────────
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
