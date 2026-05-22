# A5.1 — Hub shell + Browse tab

## P0 finding from audit

**`/app/jobs` is functionally empty.** All four tab views are 3-line stubs:

```
src/domains/jobs/components/views/BrowseView.tsx     → "Browse view coming soon."
src/domains/jobs/components/views/CompaniesView.tsx  → "Companies view coming soon."
src/domains/jobs/components/views/LocationsView.tsx  → "Locations view coming soon."
src/domains/jobs/components/views/ToolsView.tsx      → "Tools view coming soon."
```

Meanwhile, the real machinery is sitting **unused**:
- `InfiniteJobsList.tsx` (172 LOC) — wired to `useRankedJobs` + sentinel-based infinite scroll
- `useJobsHubDashboard` — returns `{ trending, in_field, companies, countries, remote, type_counts }`
- `useRankedJobs` — keyset-paginated, per-card match %, deterministic ranking (memory: Zero-Latency Matching)
- `AppJobs.tsx` (426 LOC) — full search + filters experience, but routed at `/app/jobs/all`, not the hub default

Net effect: every talent who taps "Jobs" in the bottom nav lands on a blank page. The full jobs list is hidden behind a route they have no link to.

## A5.1 scope (Browse only — Companies/Locations/Tools handled in A5.2/A5.3)

### Step 1 — Replace `BrowseView` stub with a real composition
Use what already exists. Render in order:

```
┌─ JobsHubHeader (already there)
├─ Trending strip      ← dashboard.trending  (horizontal scroll, top 6, JobCard compact)
├─ In your field strip ← dashboard.in_field  (horizontal scroll, top 6)
├─ Type counts chips   ← dashboard.type_counts (clickable → /app/jobs/all?type=...)
├─ "Recommended for you" header + match-% badge legend
└─ <InfiniteJobsList talentId={talent?.id} />  ← the real list
```

For unauthenticated talents (no `talent?.id`), fall back to:
- Trending strip (public data)
- "Sign in for personalized matches" CTA → `/auth?returnTo=/app/jobs`

### Step 2 — Humanize `useJobsHubDashboard` + `useRankedJobs` + `InfiniteJobsList`
Strip the "Digital Workforce / Phase Z0 / HUD: EXECUTING_… / CTO Reference / Z0 Hardened" jargon from:
- JSDoc blocks (3 hooks/components)
- `console.error("[Digital Workforce] ANOMALY: …")` → `console.error("get_jobs_hub_dashboard failed", { ... })`
- Inline numbered comments ("1. TanStack…", "2. High-Performance Defensive…")

Behavior unchanged — comments + log strings only.

### Step 3 — Beef up `JobsHubHeader`
Currently 8 lines, just `<h1>Jobs Hub</h1>`. Add:
- Search box that deep-links to `/app/jobs/all?q=…` (reuses the working search there)
- "View all jobs" link → `/app/jobs/all` (so users can still reach the full filter UI)
- Preferences trigger → `JobPreferencesSheet` (already exists, currently unmounted)

### Step 4 — Profile completeness gate
`ProfileCompletenessGate.tsx` exists but is never imported. Mount it above the Recommended list when `talent` is present but readiness < 60% (matches A4 readiness logic).

### Step 5 — Auth gate guard
`/app/jobs` already redirects unauth users via `OnboardingGuard` for protected routes; double-check the `Navigate to="/auth?returnTo=/app/jobs"` path is intact (memory: Auth Gate for Services).

### Step 6 — Verification
- Open `/app/jobs` as admin in preview → Browse tab renders Trending + In-Field + InfiniteJobsList.
- Scroll → sentinel fires `fetchNextPage`.
- Tap a card → navigates to `/app/jobs/:id` (A5.4 territory but smoke-test routing).
- Console clean of `Digital Workforce` log noise.
- Tap "View all" → `/app/jobs/all` renders the existing filterable list unchanged.

## Out of scope for A5.1
- `CompaniesView` / `LocationsView` / `ToolsView` stubs (A5.2 + A5.3).
- `AppJobs.tsx` refactor (deferred — works fine standalone, reachable via "View all").
- Job detail / apply / messages (A5.4 / A5.5).
- Comment-only jargon scrub of files not touched here (defer to pre-launch sweep).

## Decisions needed from you

1. **Trending + In-Field strips** — show as horizontal scrollers (mobile-first, current memory pattern) or vertical sections above the infinite list? Recommend: horizontal scroll for both, then full infinite list below.
2. **`/app/jobs/all`** — keep as-is and link "View all jobs" from the hub, or eventually merge its filter UI into Browse and delete the route? Recommend: keep for A5.1 (low-risk), revisit in A5.7.
3. **Profile gate threshold** — show ProfileCompletenessGate when readiness is below what %? Recommend 60% (matches A4 "go live" floor).

## Estimated work
~45 min for steps 1–5, ~10 min for verification, ~5 min for audit log. Single session.

Once you approve, I'll execute steps 1 → 6 and append the `## A5.1 — shipped` block to `.lovable/launch-audit.md`.
