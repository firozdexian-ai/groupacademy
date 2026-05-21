/**
 * Learning domain barrel. Aggregates hooks + typed edge-function client
 * for talent (`/app/learning`, `/app/instructor`), gro10x (`/gro10x/learn`),
 * and admin (`dashboard/learning`) shells.
 */
export * from "./hooks/useAuthoringTrends";
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

export * from "./api/manifest";

// Talent-shell UI surface
export * from "./components/talent/ActiveCourseHero";
export * from "./components/talent/AdaptiveSnapshotCard";
export * from "./components/talent/CareerTracksPreview";
export * from "./components/talent/CoursesTab";
export * from "./components/talent/EventsTab";
export * from "./components/talent/ItemBankAnalyticsPanel";
export * from "./components/talent/ItemRewriteSheet";
export * from "./components/talent/JoinLivePanel";
export * from "./components/talent/LearningStreak";
export * from "./components/talent/ModuleQuizRunner";
export * from "./components/talent/ModuleScenarioRunner";
export * from "./components/talent/MyCoursesTab";
export * from "./components/talent/NextActionsCard";
export * from "./components/talent/QuickActionCard";
export * from "./components/talent/QuickStats";
export * from "./components/talent/ReviewQueueRunner";
export * from "./components/talent/SkillCredentialsPanel";
export * from "./components/talent/StudyAbroadSection";
export * from "./components/talent/TalentMirrorPanel";
export * from "./components/talent/TrackProgressRing";
export * from "./components/talent/TracksTab";
export * from "./components/talent/UnifiedDiscovery";
export * from "./components/talent/UpcomingSessionsRail";
export * from "./components/talent/WebinarEnrollPanel";
export * from "./components/talent/views/AcademyView";
export * from "./components/talent/views/MyHubView";
export * from "./components/talent/views/StudyAbroadView";
export * from "./components/talent/views/TracksView";
