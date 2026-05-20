/**
 * Public surface of the profile domain.
 */

// Hooks
export * from "./hooks/usePublicProfileSettings";
export * from "./hooks/useTalentPitches";
export * from "./hooks/useTalentMirror";
export * from "./hooks/useTalentOutcomeSignal";
export * from "./hooks/useTalentLists";
export * from "./hooks/useTalentRelationships";
export * from "./hooks/useTalentSearch";

// API
export * from "./api/manifest";

// Talent UI
export * from "./components/talent/ProfileCompletionMeter";
export * from "./components/talent/ProfileCompletionPrompt";
export * from "./components/talent/ProfileSectionEditor";
export * from "./components/talent/ProfileEditDialog";
export { PublicProfileSettings as PublicProfileSettingsPanel } from "./components/talent/PublicProfileSettings";
export * from "./components/talent/ExperienceEditor";
export * from "./components/talent/EducationEditor";
export * from "./components/talent/SkillsEditor";
export * from "./components/talent/CVUploadSection";
export * from "./components/talent/CoverImageUpload";
export * from "./components/talent/ProfilePhotoUpload";
export * from "./components/talent/ApplicationHistoryCard";
export * from "./components/talent/ServiceHistoryCard";
