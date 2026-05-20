/**
 * Public surface of the Agents domain. Shells must import from here, never
 * from internal files, so we can refactor freely behind this boundary.
 */
export * from "./registry";
export {
  agentRuntime,
  aiGeneralChat,
  adminSupportAssistant,
  aiSupportAssistant,
  agentBlueprint,
  ingestAgentKnowledge,
  agentEventDispatcher,
} from "./api/manifest";
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
} from "./api/manifest";
