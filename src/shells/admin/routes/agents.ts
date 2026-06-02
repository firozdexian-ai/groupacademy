import React from "react";
import { AgentRedirectStub } from "@/domains/agents/components/admin/chat/AgentRedirectStub";

/**
 * Group Academy — Agent Route Registry
 * Version: Phase 10j.5 Hardened
 * Architecture: Consolidated "Agent OS" Redirect Pattern.
 * Purpose: Minimize dashboard surface area by funneling legacy agent tabs
 * into the unified Workforce Command Center.
 */

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  // --- CORE SYSTEM ROUTE (Keep) ---
  "agents-command-center": React.lazy(() =>
    import("@/pages/dashboard/WorkforceCommandCenter").then((m) => ({ default: m.WorkforceCommandCenter })),
  ),

  // --- REDIRECT STUBS (Redirect to /dashboard/chat) ---
  "agent-outreach": createRedirect("agent-outreach"),
  "agents-overview": createRedirect("agents-overview"),
  "agents-channels": createRedirect("agents-channels"),
  "agents-multichannel": createRedirect("agents-multichannel"),
  "agents-tools": createRedirect("agents-tools"),
  "agents-studio": createRedirect("agents-studio"),
  "agents-b2c": createRedirect("agents-b2c"),
  "agents-platform": createRedirect("agents-platform"),
  "agents-b2b": createRedirect("agents-b2b"),
  "agents-ugc": createRedirect("agents-ugc"),
  "agents-marketplace": createRedirect("agents-marketplace"),
  "agents-payouts": createRedirect("agents-payouts"),
  "agents-sessions": createRedirect("agents-sessions"),
  "agents-insights": createRedirect("agents-insights"),
};

/** * Helper: Generates a lazy component that redirects the admin to the unified chat/agent manager.
 */
function createRedirect(agentKey: string) {
  return React.lazy(() =>
    Promise.resolve({
      default: () => React.createElement(AgentRedirectStub, { agentKey }),
    }),
  );
}

export const TITLES: Record<string, string> = {
  "agent-outreach": "Agent Outreach",
  "agents-overview": "Agents Overview",
  "agents-channels": "Channels & Triggers",
  "agents-multichannel": "Routing",
  "agents-command-center": "Workforce Command Center",
  "agents-tools": "Tools & Connectors",
  "agents-studio": "Agent Studio",
  "agents-b2c": "B2C Agents",
  "agents-platform": "Platform Agents",
  "agents-b2b": "B2B Agents",
  "agents-ugc": "Community Agents",
  "agents-marketplace": "Marketplace Review",
  "agents-payouts": "Payout Management",
  "agents-sessions": "Chat Logs",
  "agents-insights": "Agent Metrics",
};
