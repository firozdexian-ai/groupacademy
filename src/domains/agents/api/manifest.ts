/**
 * Public surface of the agents domain's edge-function layer.
 * Cross-domain consumers should import from here, never from `agentsApi.ts`.
 */
export {
  agentRuntime,
  aiGeneralChat,
  adminSupportAssistant,
  aiSupportAssistant,
  agentBlueprint,
  ingestAgentKnowledge,
  agentEventDispatcher,
} from "./agentsApi";
export type {
  AgentRuntimeRequest,
  AgentRuntimeResponse,
  AiGeneralChatRequest,
  AiGeneralChatResponse,
  AdminSupportAssistantRequest,
  AdminSupportAssistantResponse,
  AiSupportAssistantRequest,
  AiSupportAssistantResponse,
  AgentBlueprintRequest,
  AgentBlueprintProposal,
  AgentBlueprintResponse,
  IngestAgentKnowledgeRequest,
  IngestAgentKnowledgeResponse,
  AgentEventDispatcherRequest,
  AgentEventDispatcherResponse,
} from "@/edge/contracts/agents";
