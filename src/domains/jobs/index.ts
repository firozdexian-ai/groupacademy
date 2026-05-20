/**
 * Jobs domain barrel. Surfaces hooks + typed edge-function client for every
 * shell (talent `/app/jobs`, gro10x `/gro10x/work`, admin `dashboard/jobs`).
 */
export * from "./hooks/useApplicationBuckets";
export * from "./hooks/useApplicationHistory";
export * from "./hooks/useApplicationMessages";
export * from "./hooks/useEmployerPipeline";
export * from "./hooks/useJobInvitations";
export * from "./hooks/useJobMatchCached";
export * from "./hooks/useJobTypeCounts";
export * from "./hooks/useJobsHubDashboard";
export * from "./hooks/useJobsInField";
export * from "./hooks/useRankedJobs";
export * from "./hooks/useTrendingJobs";
export * from "./api/manifest";

// Components
export * from "./components/AIJobInsights";
export * from "./components/CompanyCard";
export * from "./components/CompanyDetailSheet";
export * from "./components/CountryCard";
export * from "./components/ExternalApplicationPrep";
export * from "./components/InfiniteJobsList";
export * from "./components/JobCard";
export * from "./components/JobPreferencesSheet";
export * from "./components/JobsHubHeader";
export * from "./components/ProfileCompletenessGate";
export * from "./components/RelatedJobs";
export * from "./components/ScoreMeJobPicker";
export * from "./components/VerifiedMatchBadge";
export * from "./components/WhyYouMatchPanel";
