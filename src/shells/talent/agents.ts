/**
 * Talent shell — Agents entry points. Imports the same domain module as
 * admin but through a shell-scoped lazy boundary so the talent bundle only
 * pulls the talent-facing screens.
 */
import { lazy } from "react";

export const TalentAgentChat = lazy(() => import("@/pages/app/AgentChat"));
export const TalentMyAgents = lazy(() => import("@/pages/app/MyAgents"));

export { AGENT_REGISTRY, agentsApi, getAgent } from "@/domains/agents";
