/**
 * Public surface of the talent domain's edge-function layer.
 */
export { talentApi, type TalentApi } from "./talentApi";
export {
  batchParseCvs,
  aiSupportAssistant,
  generateOutreachMessage,
} from "./talentApi";
export type {
  BatchParseCvsRequest,
  BatchParseCvsResponse,
  AiSupportAssistantRequest,
  AiSupportAssistantResponse,
  GenerateOutreachMessageRequest,
  GenerateOutreachMessageResponse,
} from "@/edge/contracts/talent";

export const TALENT_EDGE_FUNCTIONS = [
  "batch-parse-cvs",
  "ai-support-assistant",
  "generate-outreach-message",
] as const;

export type TalentEdgeFunction = (typeof TALENT_EDGE_FUNCTIONS)[number];
