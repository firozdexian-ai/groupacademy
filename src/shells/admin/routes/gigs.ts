import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "gigs-overview": React.lazy(() => import("@/domains/gigs/components/admin/GigOverviewTab").then(m => ({ default: m.GigOverviewTab }))),
  "gigs-scoper": React.lazy(() => import("@/domains/gigs/components/admin/GigOverviewTab").then(m => ({ default: m.GigOverviewTab }))),
  "gigs-quick-actions": React.lazy(() => import("@/domains/gigs/components/admin/GigsQuickActionsTab").then(m => ({ default: m.GigsQuickActionsTab }))),
  "gigs-marketplace": React.lazy(() => import("@/domains/gigs/components/admin/GigsMarketplaceTab").then(m => ({ default: m.GigsMarketplaceTab }))),
  "gigs-course-projects": React.lazy(() => import("@/domains/gigs/components/admin/GigsCourseProjectsTab").then(m => ({ default: m.GigsCourseProjectsTab }))),
  "gigs-client-projects": React.lazy(() => import("@/domains/gigs/components/admin/ClientProjectsTab").then(m => ({ default: m.ClientProjectsTab }))),
  "gigs-managed-projects": React.lazy(() => import("@/domains/gigs/components/admin/ManagedProjectsTab").then(m => ({ default: m.ManagedProjectsTab }))),
  "gigs-submissions": React.lazy(() => import("@/domains/gigs/components/admin/GigsSubmissionsTab").then(m => ({ default: m.GigsSubmissionsTab }))),
  "gigs-verification": React.lazy(() => import("@/domains/gigs/components/admin/GigVerificationQueueTab").then(m => ({ default: m.GigVerificationQueueTab }))),
  "gigs-reviewers": React.lazy(() => import("@/domains/gigs/components/admin/ReviewerProgramTab").then(m => ({ default: m.ReviewerProgramTab }))),
  "gigs-matchmaker": React.lazy(() => import("@/domains/gigs/components/admin/GigMatchmakerTab").then(m => ({ default: m.GigMatchmakerTab }))),
  "gigs-workers-wallet": React.lazy(() => import("@/domains/gigs/components/admin/GigWorkersWalletTab").then(m => ({ default: m.GigWorkersWalletTab }))),
};

export const TITLES: Record<string, string> = {
  "gigs-overview": "Gig Economy Overview",
  "gigs-scoper": "AI Scoper Queue",
  "gigs-quick-actions": "Quick Action Gigs",
  "gigs-marketplace": "Marketplace Gigs",
  "gigs-course-projects": "Course Projects",
  "gigs-client-projects": "Client Projects",
  "gigs-managed-projects": "Managed Projects",
  "gigs-submissions": "Gig Submissions",
  "gigs-verification": "Verification Queue",
  "gigs-reviewers": "Reviewer Program",
  "gigs-matchmaker": "Gig Matchmaker",
  "gigs-workers-wallet": "Workers Wallet",
};
