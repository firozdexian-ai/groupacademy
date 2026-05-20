/**
 * Public surface of the talent domain's edge-function layer.
 */
export {
  batchParseCvs,
  generateOutreachMessage,
} from "./talentApi";
export type {
  BatchParseCvsRequest,
  BatchParseCvsResponse,
  GenerateOutreachMessageRequest,
  GenerateOutreachMessageResponse,
} from "@/edge/contracts/talent";
