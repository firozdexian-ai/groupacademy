# B6 — Hide-Nav, Demand Signals, Sidebar Pruning — Shipped

## Changes

1. **TalentHome (`src/pages/app/TalentHome.tsx`)** — removed Employer Pitches block. Cleaned unused imports (`Sparkles`, `Building2`, `useTalentPitches`, `Pitch` type, `dispatchedCount`). Deep link `/app/pitches` still resolves.

2. **TalentAppShell (`src/layouts/TalentAppShell.tsx`)** — removed Creator Analytics menu item from More-sheet; dropped now-unused `BarChart3` import. Deep link `/app/creator/analytics` still resolves.

3. **Admin Demand Signals widget**
   - New: `src/domains/analytics/components/admin/overview/DemandSignalsTab.tsx`
   - Registered tab key `signals-waitlist` (title: "Demand signals") in `src/shells/admin/routes/overview.ts`.
   - Reads `feature_waitlist` directly via admin RLS; aggregates per `feature_key`: total, unique (user_id || email), last 7d, last 24h. "Hot" badge when 7d ≥ 10.
   - Empty + error states handled.

## Audit (no nav entries found — kept as deep-link-only)

- `/app/gigs/appeals`
- `/app/gigs/disputes`
- `/app/blog` (in-app duplicate of `/app/learning/blog`)
- `/app/abroad/ielts-legacy`
- `Gro10xSideNav` / `Gro10xBottomNav` — clean of deferred routes.

## Verification

- TS compile clean.
- `/dashboard?tab=signals-waitlist` → renders Demand Signals widget.
- TalentHome no longer shows Pitches card; More-menu no longer shows Creator Analytics; all 6 deferred deep links still resolve.

## v0.5 Defer Matrix — COMPLETE

B1 (matrix) → B2 (gate) → B3 (DB) → B5 (apply gates) → B6 (prune nav + signals) all shipped.
