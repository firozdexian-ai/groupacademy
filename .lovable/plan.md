# Phase 2 — Gro10x (B2B) Shell Hardening

Goal: make every Gro10x route either fully functional or visibly gated, so a tester landing on the company portal sees only working surfaces or a branded "Coming soon" card — never a blank screen, console error, or half-built table.

Phase 1 (Talent) status: route error boundary, MyAgents gates, ReviewerCockpit content, Gro10x auth guard, and 5 talent route gates (agent-marketplace, projects, abroad/applications, counsellor, competitions) are live.

---

## A. Triage every Gro10x route

For each route in `src/gro10x/Gro10xRoutes.tsx`, classify as **Live**, **Gate**, or **Hide-from-nav** by reading the page and checking whether its data dependency is seeded and its UI handles loading/empty/error.

Working assumption from a quick pass (to be confirmed during execution):

| Route | Likely action | Notes |
|---|---|---|
| `/gro10x` (Landing), `/auth`, `/signin`, `/welcome` | Live | Marketing + auth |
| `/inbox`, `/c/:agentKey` | Live | Agent chat — same engine as talent, already shipped |
| `/feed` | Live with empty-state audit | Shared feed |
| `/page`, `/page/:companyId` | Live | Company profile |
| `/me` | Live | Profile |
| `/work` | Live with empty-state audit | Jobs + applicants |
| `/work/jobs/:jobId/applicants`, `/work/applications`, `/work/applications/:id/offer/new` | Live, verify empty/error | Hiring loop |
| `/billing` | Live | Credits + transactions |
| `/learn`, `/learn/track/:trackId` | Live with empty-state | B2C learn for employer |
| `/learn/ops` | Gate or empty-state | B2B Learning Ops — depends on sponsored assignments |
| `/crm` | Gate if no leads seeded | Employer CRM |
| `/offerings` | Gate | Newer surface, likely empty |
| `/sourcing`, `/sourcing/lists` | Live with empty-state | Talent search |
| `/agents` (Agent Marketplace) | Gate | Same risk as talent agent-marketplace |
| `/work/projects` | Gate | Managed Projects — escrow not live for employers |
| `/work/gigs/:gigId/bids` | Gate or "no bids yet" empty-state | Gig bids |

Gates use `ComingSoonGate` with employer-scoped `featureKey`s (`gro10x-projects`, `gro10x-agents`, `gro10x-offerings`, `gro10x-learn-ops`, etc.) so waitlist signups segment cleanly from talent waitlists.

## B. Nav hygiene

`Gro10xSideNav` currently exposes Agents, CRM, Sourcing, Offerings, Learning Ops, Billing in the secondary section. After gating:

- Remove Agents, Offerings, Learning Ops from the side nav while they are gated (deep link still resolves to the waitlist card).
- Keep CRM/Sourcing visible but ensure each renders an empty-state, not a crash, on a fresh tenant.
- `Gro10xBottomNav` (Inbox / Activities / Learn / Feed / Company) stays as-is — all five are core flows.

Audit `Gro10xCommandPalette` for the same entries and remove links to gated surfaces.

## C. Resilience pass

For every Live page in the table, confirm the three-state contract: loading skeleton → error state → empty state (never a naked spinner, never a thrown promise). Reuse `PageLoadingSkeleton` + the existing empty-state cards used in talent hubs. Wrap any remaining raw `supabase.from(...)` effects in a try/catch that surfaces a toast and renders an inline error card.

`RouteErrorBoundary` is already wrapping `<Outlet />` in `Gro10xAppShell`, so unhandled throws will fall back to the branded error card — but we still want clean per-page empty states.

## D. Verification

Walk the Gro10x nav on:
1. A fresh unauthenticated session → landing → sign in.
2. An onboarded employer on mobile (390px) → bottom nav round-trip.
3. Same employer on desktop (1440px) → side nav + ⌘K palette round-trip.

Capture any remaining blank/error screens and gate or fix them. Hand off to Phase 3 (Admin shell) once the Gro10x walk is clean.

## Technical notes

- Gating is applied at the **route element** in `Gro10xRoutes.tsx` so page modules stay lazy-loaded and never execute their data effects when the feature is off.
- `ComingSoonGate` already supports `description`, `secondaryCtaLabel`, `secondaryCtaHref` — point the secondary CTA at `/gro10x/inbox` (back into the working surface) rather than the marketing site.
- Nav-hiding is done by filtering the `LINKS` arrays in `Gro10xSideNav.tsx` and the palette entries; no need for runtime feature flags yet.
- No backend or schema changes in this phase — purely shell + presentation hardening.

## Out of scope

- Admin Dashboard chat fix (Phase 3) — pending sub-agent trace results.
- New B2B features (Offerings UI, Learning Ops dashboards) — they stay gated until Phase 4.
- Re-theming or design refinement — visual changes only where a gate or empty-state card is introduced.

Approve and I'll execute A → B → C in that order, then summarise Live vs Gated for the Gro10x shell and tee up Phase 3 (Admin).
