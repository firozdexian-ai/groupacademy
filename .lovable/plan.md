# Next Phase — A6: Gigs Hub Parity & Polish

V0.5 jargon cleanup (B3–B5) is complete across talent-facing surfaces. The launch audit's own recommended next step is **A6 — Gigs Hub parity** (matching the quality bar set by A5 Jobs Hub: clean shell, no "coming soon" stubs, humanized copy, working empty/loading states, real recommendations).

## Goal
Bring `/app/gigs/*` to the same launch-ready quality as `/app/jobs/*`: clear tabs, real data in every tab, friendly copy, profile-aware recommendations, and no orphan/stub views — without changing schema, RPCs, or business logic.

## Scope (talent-facing only)

### A6.1 — Gigs shell + Browse/For-You tabs
- `src/pages/app/Gigs.tsx` (735 lines): audit the 4-tab structure (Browse / For You / My Submissions / Disputes). Wire `GigForYouTab` as the default landing tab for authenticated talents (parity with A5.1 Jobs Browse). Confirm `useGigsHubDashboard` powers the strips; replace any leftover stubs with real `InfiniteGigsList` + `GigCard` content.
- `AvailabilityWidget` mounted prominently on For-You tab (per `mem://product/gig-matchmaker-and-bid-coach`).
- Header: title, subtitle, search box (deep-link to filtered list), credit-balance chip.

### A6.2 — Gig Detail & Submission flow
- `MarketplaceGigDetail.tsx`, `NewGigWizard.tsx`, `GigSubmissionForm.tsx`, `BidCoachDialog.tsx`: tighten copy, ensure consistent CTAs ("Submit bid", "Save draft", "Open Bid Coach"), surface verification verdict via `VerificationVerdictCard` when present.
- `MySubmissions.tsx`: surface status pills (Pending / In review / Approved / Revision requested / Rejected) with friendly explanations.

### A6.3 — Disputes & Appeals
- `GigDisputes.tsx` + `GigAppeals.tsx`: empty states, friendly copy, link to reviewer guidelines.

### A6.4 — Recommendations & Bid Coach
- Confirm `RecommendedBiddersPanel` (employer-side) is correctly gated to employer/admin routes only and not leaking into talent shell.
- Verify `BidCoachDialog` opens from a clear CTA on each gig card / detail, and credit cost is shown up front.

### A6.5 — Closeout audit
- Spot-check residual jargon in JSDoc/console (B5 leftovers).
- Update `.lovable/launch-audit.md` with an A6 section: findings, shipped items, deferred carry-overs.
- Update `.lovable/plan.md` to mark A6 done.

## Out of scope
- Schema, RPCs, edge functions, RLS, pricing logic, matchmaker scoring.
- Admin Gigs surfaces (`/dashboard/gigs/*`) and Gro10x employer Gigs (`/gro10x/work/*`) — separate phases.
- Career Abroad (separate A8 candidate).
- Visual redesign beyond copy/empty-state polish.

## Process
1. Read all 14 gig component files + 6 gig pages + `useGigsHubDashboard` / `useRankedGigs` hooks to baseline.
2. Implement in 3 parallel batches: (a) shell + Browse/For-You, (b) Detail + Submission + Disputes pages, (c) shared component copy.
3. Verify via preview (`/app/gigs`) — confirm no blank tabs, working empty states, no jargon in visible copy.
4. Update audit + plan docs.

## Deliverable estimate
~15 files touched, no migrations, ~60–90 min of work. Targets a P1 closeout matching A5.

If you'd prefer **A7 (Profile / Talent Mirror polish)** or **A8 (Career Abroad)** instead, say the word and I'll re-plan.
