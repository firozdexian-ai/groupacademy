import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "agent-outreach": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentOutreachTab").then((m: any) => ({ default: m.AgentOutreachTab ?? m.AgentOutreachManager ?? m.default })),
  ),
  "agents-overview": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentsOverviewTab").then((m) => ({ default: m.AgentsOverviewTab })),
  ),
  "agents-channels": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentChannelsTab").then((m) => ({ default: m.AgentChannelsTab })),
  ),
  "agents-multichannel": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentMultichannelTab").then((m) => ({ default: m.AgentMultichannelTab })),
  ),
  "agents-command-center": React.lazy(() =>
    import("@/pages/dashboard/WorkforceCommandCenter").then((m) => ({ default: m.WorkforceCommandCenter })),
  ),
  "agents-tools": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentToolsTab").then((m) => ({ default: m.AgentToolsTab })),
  ),
  "agents-studio": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentStudioTab").then((m: any) => ({ default: m.AgentStudioTab ?? m.AgentStudio ?? m.default })),
  ),
  "agents-b2c": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsB2CTab })),
  ),
  "agents-platform": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsPlatformTab })),
  ),
  "agents-b2b": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsB2BTab })),
  ),
  "agents-ugc": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsUGCTab })),
  ),
  "agents-marketplace": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentMarketplaceTab").then((m: any) => ({ default: m.AgentMarketplaceTab ?? m.AgentMarketplaceReview ?? m.default })),
  ),
  "agents-payouts": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentPayoutsTab").then((m: any) => ({ default: m.AgentPayoutsTab ?? m.AgentPayoutsManager ?? m.default })),
  ),
  "agents-sessions": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentSessionsTab").then((m: any) => ({ default: m.AgentSessionsTab ?? m.AgentSessionsManager ?? m.default })),
  ),
  "agents-insights": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentInsightsTab").then((m: any) => ({ default: m.AgentInsightsTab ?? m.AgentInsights ?? m.default })),
  ),
};

export const TITLES: Record<string, string> = {
  "agent-outreach": "Proactive outreach",
  "agents-overview": "Agents overview",
  "agents-channels": "Channels & triggers",
  "agents-multichannel": "Multichannel routing",
  "agents-command-center": "Workforce command center",
  "agents-tools": "Tools, skills & connectors",
  "agents-studio": "Agent studio",
  "agents-b2c": "B2C agents",
  "agents-platform": "Platform agents",
  "agents-b2b": "B2B agents",
  "agents-ugc": "User-generated agents",
  "agents-marketplace": "Marketplace review",
  "agents-payouts": "Agent payouts",
  "agents-sessions": "Sessions log",
  "agents-insights": "Agent insights",
};
