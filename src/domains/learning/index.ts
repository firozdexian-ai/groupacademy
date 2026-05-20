/**
 * Learning domain barrel. Aggregates hooks + typed edge-function client
 * for talent (`/app/learning`, `/app/instructor`), gro10x (`/gro10x/learn`),
 * and admin (`dashboard/learning`) shells.
 */
export * from "./hooks/useCertificate";
export * from "./hooks/useCohorts";
export * from "./hooks/useCourseBriefs";
export * from "./hooks/useCourseProgress";
export * from "./hooks/useEnrollment";
export * from "./hooks/useInstructorWorkspace";
export * from "./hooks/useItemAnalytics";
export * from "./hooks/useItemRewrite";
export * from "./hooks/useItemTranslate";
export * from "./hooks/useLearningHubDashboard";
export * from "./hooks/useLearningStats";
export * from "./hooks/useLearningTracks";
export * from "./hooks/useMasterySummary";
export * from "./hooks/useModuleResources";
export * from "./hooks/useModuleReviewBadge";
export * from "./hooks/useNextActions";
export * from "./hooks/useOrgLearning";
export * from "./hooks/useProgress";
export * from "./hooks/useResourceProgress";
export * from "./hooks/useReviewQueue";
export * from "./hooks/useSkillCredentials";
export * from "./hooks/useStageProgress";
export * from "./hooks/useTutorMasteryContext";

export { learningApi } from "./api/manifest";
export type { LearningApi } from "./api/manifest";
