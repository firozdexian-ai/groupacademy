/**
 * Admin shell — Agents entry points. Lazy-loaded so admin code never lands
 * in the talent or gro10x bundles.
 */
import { lazy } from "react";

export const AdminAgentChat = lazy(() => import("@/pages/app/AgentChat"));
export const AdminAgentsDashboard = lazy(() => import("@/pages/DashboardChat"));

export { AGENT_REGISTRY, agentsApi } from "@/domains/agents";
