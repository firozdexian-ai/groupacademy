# B5 Batch 2 — Shipped

Wrapped remaining **coming-soon** surfaces from the defer matrix.

## Changes

1. **Gigs Marketplace sub-tab** (`src/pages/app/Gigs.tsx`)
   - Wrapped the `client` `<TabsContent>` body with `<ComingSoonGate featureKey="gigs-marketplace">`.
   - For-You tab untouched. Other tabs untouched.

2. **Leaderboards threshold gate** (`src/pages/public/PublicLeaderboard.tsx`)
   - Renamed page body to `PublicLeaderboardInner`.
   - New default export wraps inner with `<ComingSoonGate featureKey="leaderboards-${kind}">`.
   - `showWhen={hasEnough === true}` — `hasEnough` is set to `true` only when `getLeaderboard({ kind, period: "alltime" })` returns ≥ 10 rows.
   - While `hasEnough === null` (loading) → gate shows (safe default).

## Notes

- Did **not** extend `ComingSoonGate` for async `showWhen`. Used a wrapper component that resolves the async check into a sync boolean — simpler, no shared-component churn.
- featureKeys used: `gigs-marketplace`, `leaderboards-talents`, `leaderboards-companies`, `leaderboards-reviewers`.

## Verification

- TS compile clean.
- Manual smoke (preview):
  - `/app/gigs` → For-You tab opens normally; switch to Marketplace tab → see gate.
  - `/leaderboards/talents` → gate (zero `leaderboard_snapshots` rows currently).

## Next: B6

- Hide-nav routes: `/app/gigs/appeals`, `/app/gigs/disputes`, `/app/pitches`, `/app/creator/analytics`, `/app/blog`, `/app/abroad/ielts-legacy`.
- Admin demand-signals widget reading `feature_waitlist` aggregates.
- Nav/sidebar pruning to match defer matrix.
