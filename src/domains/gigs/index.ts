/**
 * Public surface of the gigs domain.
 */

// Hooks
export * from "./hooks/useGigsHubDashboard";
export * from "./hooks/useRankedGigs";

// API
export * from "./api/manifest";

// Talent UI (selected)
export * from "./components/talent/GigCard";
export * from "./components/talent/InfiniteGigsList";
export * from "./components/talent/GigForYouTab";
export * from "./components/talent/AvailabilityWidget";
export * from "./components/talent/RecommendedBiddersPanel";
export * from "./components/talent/VerificationVerdictCard";
export * from "./components/talent/BidCoachDialog";
export * from "./components/talent/OpenDisputeButton";
export * from "./components/talent/MySubmissions";
export { default as GigUploader } from "./components/talent/GigUploader";
