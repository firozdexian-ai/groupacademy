## B6 — Hide-Nav, Demand Signals Widget, Sidebar Pruning

Final cleanup pass for the v0.5 defer matrix. No new routes, no DB schema changes (B3 already shipped `feature_waitlist`).

### Scope

**1. Hide-nav surfaces (6 routes)**

Routes stay mounted (deep links work) but lose every UI entry point. Per the defer matrix:

| Route | Current entry | Action |
|---|---|---|
| `/app/gigs/appeals` | none found | already hidden — verify no link sneaks in |
| `/app/gigs/disputes` | none found | already hidden — verify |
| `/app/pitches` | `src/pages/app/TalentHome.tsx:152` button | remove the "Pitches" CTA |
| `/app/creator/analytics` | `src/layouts/TalentAppShell.tsx:266` sidebar item | remove that entry from the side menu |
| `/app/blog` (in-app duplicate) | none found in nav | verify clean; rely on `/app/learning/blog` instead |
| `/app/abroad/ielts-legacy` | none found in nav | verify clean |

For routes with no current nav entry, the work is a one-line `rg` audit committed as a note in `.lovable/plan.md` so we don't regress later.

**2. Admin demand-signals widget**

A new read-only admin tab that surfaces `feature_waitlist` aggregates so we can decide which deferred surfaces to ship first.

- New tab key `signals-waitlist` registered in `src/shells/admin/routes/overview.ts` (titled "Demand signals").
- New component `src/domains/analytics/components/admin/overview/DemandSignalsTab.tsx`:
  - Calls a small read RPC (or direct select via existing admin RLS) that returns `feature_key`, total signups, unique users, last 7d, last 24h.
  - Renders a sortable table + sparkline-style "Hot last 7d" badge for keys with ≥10 new signups.
  - Special-cases the `abroad-country-*` wildcard: groups rows by country slug, shows top 10.
  - Empty state if no rows.
- No mutations. Read-only.

**3. Sidebar / nav pruning to match defer matrix**

- `TalentAppShell` More-menu: drop **Creator Analytics**.
- `TalentHome` quick actions: drop **Pitches** CTA.
- Scan `Gro10xSideNav` / `Gro10xBottomNav` for any deferred links (audit only — likely clean, but worth one `rg` pass).
- No changes to bottom-nav primary tabs.

### Out of scope

- Email notifications to waitlist (P4 punch list).
- Per-country agent onboarding flow (separate track).
- Any change to coming-soon gates already shipped in B5 batches 1–2.

### Technical notes

- The signals widget reads via the existing `useSupabaseQuery` hook so it inherits the admin scope check. If we hit RLS friction, fall back to a `SECURITY DEFINER` aggregator RPC `get_feature_waitlist_signals()` — flagged but not built unless needed; would require a `supabase--migration` call mid-implementation with user approval.
- All edits are presentational. No `App.tsx` route changes, no schema changes.

### Verification

- Manual nav sweep: confirm More-menu no longer shows Creator Analytics, TalentHome no longer shows Pitches CTA.
- Deep links: `/app/creator/analytics`, `/app/pitches`, `/app/gigs/appeals`, `/app/gigs/disputes`, `/app/blog`, `/app/abroad/ielts-legacy` all still resolve (no 404).
- Admin: `/dashboard?tab=signals-waitlist` renders the new widget with current `feature_waitlist` rows.
- TS clean, build passes.

### Files touched (estimate)

- `src/layouts/TalentAppShell.tsx` — remove 1 menu item
- `src/pages/app/TalentHome.tsx` — remove Pitches CTA block
- `src/shells/admin/routes/overview.ts` — register `signals-waitlist`
- `src/domains/analytics/components/admin/overview/DemandSignalsTab.tsx` — new
- `.lovable/plan.md` — log B6 outcome + audit notes
