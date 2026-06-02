/**
 * Group Academy — Career Abroad Domain Interface Engine (Barrel Export)
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Purpose: Unified public API boundary exposing UI panels, network proxies, and graph hooks.
 * Constraints: Enforces clean domain-isolation; eliminates deep import backtracking.
 */

// ─── Front-Facing UI Components ──────────────────────────────────────────
export { RoadmapBuilderSheet } from "./components/talent/RoadmapBuilderSheet";
export { RoadmapIntakeForm } from "./components/talent/RoadmapIntakeForm";
export { RoadmapTimeline } from "./components/talent/RoadmapTimeline";

// ─── Administration & Operator Workspace Tabs ─────────────────────────────
export { AbroadOverviewTab } from "./components/admin/AbroadOverviewTab";
export { AbroadApplicationsTab } from "./components/admin/AbroadApplicationsTab";
export { AbroadProgramsTab } from "./components/admin/AbroadProgramsTab";
export { AbroadRoadmapLeadsTab } from "./components/admin/AbroadRoadmapLeadsTab";
export { AbroadDestinationsTab } from "./components/admin/AbroadDestinationsTab";
export { AbroadIELTSPromptsTab } from "./components/admin/AbroadIELTSPromptsTab";
export { AbroadIELTSResourcesTab } from "./components/admin/AbroadIELTSResourcesTab";
export { AbroadLanguageLabTab } from "./components/admin/AbroadLanguageLabTab";

// ─── Graph Query Hooks & Synchronizer Contexts ───────────────────────────
export { useAbroadGraph } from "./hooks/useAbroadGraph";
export type {
  AbroadApplication,
  AbroadProgram,
  RoadmapLead,
  DestinationAgent,
  IeltsAttempt,
  IeltsResource,
} from "./hooks/useAbroadGraph";

// ─── Typed Edge Network Invocation Engines (API) ─────────────────────────
export {
  aiDestinationAgent,
  aiIeltsEvaluate,
  aiLanguagePartner,
  bookLanguageSession,
  generateStudyRoadmap,
} from "./api/abroadApi";

// ─── Bound Integration Contract Types ────────────────────────────────────
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
