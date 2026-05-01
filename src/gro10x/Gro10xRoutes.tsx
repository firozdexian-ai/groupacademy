import { Routes, Route, Navigate } from "react-router-dom";
import { Gro10xAppShell } from "./components/Gro10xAppShell";
import Gro10xLanding from "./pages/Gro10xLanding";
import Gro10xAuth from "./pages/Gro10xAuth";
import Gro10xWelcome from "./pages/Gro10xWelcome";
import Gro10xInbox from "./pages/Gro10xInbox";
import Gro10xChat from "./pages/Gro10xChat";
import Gro10xFeed from "./pages/Gro10xFeed";
import Gro10xCompanyPage from "./pages/Gro10xCompanyPage";
import Gro10xMe from "./pages/Gro10xMe";
import Gro10xAgentMarketplace from "./pages/Gro10xAgentMarketplace";

/**
 * Routes for the Gro10x B2B super-app. Mounted under /gro10x on the
 * academy host, and at root when running on a Gro10x hostname (handled in App.tsx).
 */
export function Gro10xRoutes() {
  return (
    <Routes>
      {/* Landing + auth (no shell — full-bleed) */}
      <Route index element={<Gro10xLanding />} />
      <Route path="auth" element={<Gro10xAuth />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/gro10x" replace />} />
    </Routes>
  );
}
