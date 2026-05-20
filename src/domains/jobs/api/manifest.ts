/**
 * Jobs domain — typed edge-function surface.
 *
 * Phase 9d reduced this to a re-export barrel. Import named wrappers
 * directly from `./jobsApi` or via the domain barrel `@/domains/jobs`.
 * Do NOT add a `jobsApi` const back here; that pattern was retired.
 */
export {
  analyzeJobMarket,
  cronRebuildJobRecs,
  enhanceJobDescription,
  generateJobShareCaption,
  notifyApplicationStatus,
  notifyHiringEvent,
  parseCv,
  parseJobPost,
  scoreJobMatch,
  suggestJobsForTalent,
} from "./jobsApi";
