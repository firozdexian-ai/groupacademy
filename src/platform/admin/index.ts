/**
 * Platform layer — shared admin chrome and UI primitives.
 *
 * Consumers should import from `@/platform/admin` going forward.
 * The legacy `@/components/dashboard/*` paths remain as thin barrels
 * for backwards compatibility until Phase 8 retires them.
 */
export { AdminSidebar } from "./chrome/AdminSidebar";
export {
  DashboardCardSkeleton,
  DashboardTableSkeleton,
  DashboardErrorState,
} from "./chrome/DashboardSkeleton";
export { ImpersonationBanner } from "./chrome/ImpersonationBanner";

export { default as StatsCard } from "./ui/StatsCard";
export { ChatAgentShortcut } from "./ui/ChatAgentShortcut";
export { ConfirmPurge } from "./ui/ConfirmPurge";
export {
  DraggableList,
  DragHandle,
  type DragHandleProps,
} from "./ui/DraggableList";
export {
  SimpleAdminRegistry,
  type SimpleField,
} from "./ui/SimpleAdminRegistry";
