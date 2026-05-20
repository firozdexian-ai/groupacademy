/**
 * Public surface of the feed domain. Shells import from here.
 */

// Hooks
export * from "./hooks/useContentHype";
export * from "./hooks/useFeedEngagement";
export * from "./hooks/useFeedRecommendations";
export * from "./hooks/useHype";
export * from "./hooks/usePollVoting";
export * from "./hooks/usePostReactions";

// API
export { feedApi, type FeedApi } from "./api/manifest";

// Talent UI (re-export key composables; full set still importable by path)
export * from "./components/talent/PostCard";
export * from "./components/talent/FeedHeader";
export * from "./components/talent/FeedFilters";
export * from "./components/talent/FeedSkeleton";
export * from "./components/talent/ComposePost";
export * from "./components/talent/HypeBoostSheet";
export * from "./components/talent/HypeButton";
export * from "./components/talent/ReactionBar";
export * from "./components/talent/PollWidget";
export * from "./components/talent/CommentList";
export * from "./components/talent/QuickActionsGrid";
export * from "./components/talent/QuickActionsSheet";
