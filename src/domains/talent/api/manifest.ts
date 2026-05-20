/**
 * Public surface of the talent domain's edge-function layer.
 */
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
