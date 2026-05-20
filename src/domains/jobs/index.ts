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
export { jobsApi } from "./api/manifest";
