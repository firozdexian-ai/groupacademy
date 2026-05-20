/**
 * Talent domain edge-function manifest.
 * Phase 9 will wrap these with typed `talentApi.*` helpers.
 */
export const TALENT_EDGE_FUNCTIONS = [
  "batch-parse-cvs",
  "ai-support-assistant",
  "generate-outreach-message",
] as const;

export type TalentEdgeFunction = (typeof TALENT_EDGE_FUNCTIONS)[number];
