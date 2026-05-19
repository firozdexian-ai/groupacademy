import { Users, Sparkles, Building2, UserPlus } from "lucide-react";
import { AgentListTab } from "./AgentListTab";

export const AgentsB2CTab = () => (
  <AgentListTab
    title="Gro10x B2C Agents"
    description="Platform-built agents serving talents and end users."
    icon={Users}
    agentTypeFilter={["b2c"]}
    emptyHint="No B2C agents flagged yet — set agent_type='b2c' to populate."
  />
);

export const AgentsPlatformTab = () => (
  <AgentListTab
    title="Platform Tool-Agents"
    description="Non-conversational AI tools that earn credits (matching, parsing, scoring, generation)."
    icon={Sparkles}
    agentTypeFilter={["platform_tool"]}
  />
);

export const AgentsB2BTab = () => (
  <AgentListTab
    title="Company / B2B Agents"
    description="Gro10x B2B agents — Atlas, Recruiter, Sourcer, Outreach, Growth, Lead Hunter, CRM, Sales, etc."
    icon={Building2}
    agentTypeFilter={["b2b"]}
  />
);

export const AgentsUGCTab = () => (
  <AgentListTab
    title="User-Generated Agents"
    description="Agents created by talents and company contacts. Admin queue for review and moderation."
    icon={UserPlus}
    agentTypeFilter={["ugc"]}
    emptyHint="No user-generated agents yet — creator builder ships in v2."
  />
);
