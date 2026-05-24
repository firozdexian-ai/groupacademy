import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Gro10xAppShell } from "./components/Gro10xAppShell";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

const Gro10xLanding = lazy(() => import("./pages/Gro10xLanding"));
const Gro10xAuth = lazy(() => import("./pages/Gro10xAuth"));
const Gro10xSignIn = lazy(() => import("./pages/Gro10xSignIn"));
const Gro10xWelcome = lazy(() => import("./pages/Gro10xWelcome"));
const Gro10xInbox = lazy(() => import("./pages/Gro10xInbox"));
const Gro10xChat = lazy(() => import("./pages/Gro10xChat"));
const Gro10xFeed = lazy(() => import("./pages/Gro10xFeed"));
const Gro10xCompanyPage = lazy(() => import("./pages/Gro10xCompanyPage"));
const Gro10xMe = lazy(() => import("./pages/Gro10xMe"));
const Gro10xAgentMarketplace = lazy(() => import("./pages/Gro10xAgentMarketplace"));
const Gro10xWork = lazy(() => import("./pages/Gro10xWork"));
const Gro10xJobApplicants = lazy(() => import("./pages/work/Gro10xJobApplicants"));
const Gro10xApplications = lazy(() => import("./pages/work/Gro10xApplications"));
const Gro10xOfferComposer = lazy(() => import("./pages/work/Gro10xOfferComposer"));
const Gro10xBilling = lazy(() => import("./pages/Gro10xBilling"));
const Gro10xLearn = lazy(() => import("./pages/Gro10xLearn"));
const Gro10xLearnOps = lazy(() => import("./pages/Gro10xLearnOps"));
const AppTrackDetail = lazy(() => import("@/pages/app/AppTrackDetail"));
const Gro10xCRM = lazy(() => import("./pages/Gro10xCRM"));
const Gro10xOfferings = lazy(() => import("./pages/Gro10xOfferings"));
const Gro10xSourcing = lazy(() => import("./pages/sourcing/Gro10xSourcing"));
const Gro10xSourcingLists = lazy(() => import("./pages/sourcing/Gro10xSourcingLists"));
const Gro10xProjects = lazy(() => import("./pages/work/Gro10xProjects"));
const Gro10xGigBids = lazy(() => import("./pages/work/Gro10xGigBids"));

/**
 * Routes for the Gro10x B2B super-app. Mounted under /gro10x on the
 * academy host, and at root when running on a Gro10x hostname (handled in App.tsx).
 */
export function Gro10xRoutes() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Routes>
        {/* Landing + auth (no shell — full-bleed) */}
        <Route index element={<Gro10xLanding />} />
        <Route path="auth" element={<Gro10xAuth />} />
        <Route path="signin" element={<Gro10xSignIn />} />
        <Route path="welcome" element={<Gro10xWelcome />} />

        {/* App shell with bottom nav */}
        <Route element={<Gro10xAppShell />}>
          <Route path="inbox" element={<Gro10xInbox />} />
          <Route path="c/:agentKey" element={<Gro10xChat />} />
          <Route path="feed" element={<Gro10xFeed />} />
          <Route path="page" element={<Gro10xCompanyPage />} />
          <Route path="page/:companyId" element={<Gro10xCompanyPage />} />
          <Route path="me" element={<Gro10xMe />} />
          <Route path="agents" element={<Gro10xAgentMarketplace />} />
          <Route path="work" element={<Gro10xWork />} />
          <Route path="work/jobs/:jobId/applicants" element={<Gro10xJobApplicants />} />
          <Route path="work/applications" element={<Gro10xApplications />} />
          <Route path="work/applications/:applicationId/offer/new" element={<Gro10xOfferComposer />} />
          <Route path="billing" element={<Gro10xBilling />} />
          <Route path="learn" element={<Gro10xLearn />} />
          <Route path="learn/ops" element={<Gro10xLearnOps />} />
          <Route path="learn/track/:trackId" element={<AppTrackDetail />} />
          <Route path="crm" element={<Gro10xCRM />} />
          <Route path="offerings" element={<Gro10xOfferings />} />
          <Route path="sourcing" element={<Gro10xSourcing />} />
          <Route path="sourcing/lists" element={<Gro10xSourcingLists />} />
          <Route path="work/projects" element={<Gro10xProjects />} />
          <Route path="work/gigs/:gigId/bids" element={<Gro10xGigBids />} />
        </Route>

        <Route path="*" element={<Navigate to="/gro10x" replace />} />
      </Routes>
    </Suspense>
  );
}
