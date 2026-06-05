/**
 * Jobs domain barrel. Surfaces hooks + typed edge-function client for every
 * shell (talent `/app/jobs`, gro10x `/gro10x/work`, admin `dashboard/jobs`).
 *
 * Explicit named exports only — no `export *`.
 */

// Hooks
export { useApplicationBuckets, type ApplicationBuckets } from "./hooks/useApplicationBuckets";
export { useApplicationHistory, type ApplicationHistoryItem } from "./hooks/useApplicationHistory";
export { useApplicationMessages, type ApplicationMessage } from "./hooks/useApplicationMessages";
export {
  useEmployerPipeline,
  ensureDirectThread,
  type PipelineApplication,
  type PipelineDashboardPayload,
  type PipelineStatus,
} from "./hooks/useEmployerPipeline";
export { useInviteToApply, type InviteToApplyInput } from "./hooks/useJobInvitations";
export { useJobMatchCached, type JobMatchCache } from "./hooks/useJobMatchCached";
export { useJobTypeCounts } from "./hooks/useJobTypeCounts";
export { useJobsHubDashboard, type JobsHubDashboard } from "./hooks/useJobsHubDashboard";
export { useJobsInField } from "./hooks/useJobsInField";
export { useRankedJobs, type RankedJob, type MatchReasonType } from "./hooks/useRankedJobs";
export { useTrendingJobs } from "./hooks/useTrendingJobs";

// Components
export { AIJobInsights } from "./components/AIJobInsights";
export { CompanyCard } from "./components/CompanyCard";
export { CompanyDetailSheet } from "./components/CompanyDetailSheet";
export { CountryCard } from "./components/CountryCard";
export { ExternalApplicationPrep } from "./components/ExternalApplicationPrep";
export { InfiniteJobsList } from "./components/InfiniteJobsList";
export { JobCard, type JobCardData, type JobMatchInfo } from "./components/JobCard";
export { JobPreferencesSheet } from "./components/JobPreferencesSheet";
export { JobsHubHeader } from "./components/JobsHubHeader";
export { ProfileCompletenessGate } from "./components/ProfileCompletenessGate";
export { RelatedJobs } from "./components/RelatedJobs";
export { ScoreMeJobPicker } from "./components/ScoreMeJobPicker";
export { VerifiedMatchBadge } from "./components/VerifiedMatchBadge";
export { WhyYouMatchPanel } from "./components/WhyYouMatchPanel";

// Edge-function API surface
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
} from "./api/manifest";
