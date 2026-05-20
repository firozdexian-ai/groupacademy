# Phase 7 — Admin route shells + per-domain code-splitting

`src/pages/Dashboard.tsx` is 585 LOC and contains a 296-line `TAB_COMPONENTS` registry of **146 `React.lazy()` calls** plus a 205-line `TAB_TITLES` label map, both pointing at the legacy `@/components/dashboard/*` barrels. Phase 7 splits this monolith into per-domain route modules under `src/shells/admin/routes/`, retargets the lazy imports at the new `@/domains/<X>` paths, and shrinks `Dashboard.tsx` to a thin shell.

## Why now

- Every domain has a clean `src/domains/<X>/components/admin/` home (Phases 5.13a–c). The lazy targets can finally point at canonical paths instead of barrels.
- Bundling currently emits one large chunk per `import()` call inside one giant file; webpack/vite handles per-domain prefetching better when the lazy map is split.
- `Dashboard.tsx` mixes route registry, title map, and render shell — hard to scan, edit, and review.

## Lazy import inventory (146 routes)

| Domain | Lazy imports | Notes |
|---|---|---|
| learning | 18 | Largest group (academies, courses, cohorts, payouts, etc.) |
| marketing | 12 | Channels, leads, banners, outreach variants |
| gigs | 12 | Marketplace, projects, verification, reviewer, matchmaker |
| talent / crm | 10 | All Phase 5.13c targets |
| jobs | 9 | Hub + admin tabs |
| finance / finops | 8 | Credits ledgers, invoices, withdrawals |
| abroad | 8 | Destinations, applications, programs, IELTS, language lab |
| overview | 6 | Lifetime/period/analyst/reports (parametric) |
| ugc | 4 | Blog, feed, competitions, videos |
| companies | 7 | Companies, contacts, agents, industries, overview, unlocks |
| agents | 14 | Overview, channels, studio, b2c, b2b, marketplace, etc. |
| institutions, ir, hr, workforce, gtm, chat, messaging, etc. | remaining | One-offs |

## Target layout

```text
src/shells/admin/
  agents.ts              (existing)
  routes/
    index.ts             // mergeRouteMaps(...) → Record<string, LazyExoticComponent<any>>
    titles.ts            // Record<string, string> — full label map
    overview.ts
    talent.ts            // 10 crm-* routes
    companies.ts
    jobs.ts              // 9 jobs-* + Hub routes
    learning.ts          // 18 routes
    marketing.ts         // 12 routes
    finance.ts           // 8 finops-* routes
    gigs.ts              // 12 gigs-* routes
    abroad.ts            // 8 abroad-* routes
    institutions.ts
    ir.ts
    hr.ts
    ugc.ts
    agents.ts            // 14 agents-* routes (extends shells/admin/agents.ts)
    misc.ts              // leftovers (chat, messaging, workforce, gtm, etc.)
  Shell.tsx              // optional: extracted render shell (Sidebar + Suspense + TabComponent)
```

Each domain module exports `ROUTES: Record<string, LazyExoticComponent<any>>` and optionally `TITLES: Record<string, string>`. `routes/index.ts` spreads them; `Dashboard.tsx` imports the merged maps.

## Scope

1. **Create `src/shells/admin/routes/`** with one file per domain group above. Each file:
   - Re-points `React.lazy(() => import("@/components/dashboard/<domain>/X"))` to `import("@/domains/<domain>/components/admin/X")` (the canonical path). Keeps the existing `m.X ?? m.Manager ?? m.default` fallback resolver so every legacy alias still binds.
   - Preserves parametric routes (overview `month`/`quarter`/`year`) verbatim.
2. **Extract `TAB_TITLES`** to `src/shells/admin/routes/titles.ts`. Re-export from each domain file (titles colocated with routes) or keep one flat map — pick colocated to mirror routes layout.
3. **Create `src/shells/admin/routes/index.ts`** that imports each domain module, merges `ROUTES` via spread into one `TAB_COMPONENTS` map, and merges `TITLES` similarly. Exports both.
4. **Slim `src/pages/Dashboard.tsx`** to import the merged maps + render the sidebar/suspense shell. Preserve every existing behavior (RBAC scope, search-params, impersonation banner, toast on tab-not-found, etc.).
5. **Optional**: extract the render body (lines ~523–585) to `src/shells/admin/Shell.tsx` and have `Dashboard.tsx` just render `<AdminShell />`. Only do this if `Dashboard.tsx` would still exceed ~120 LOC after step 4.
6. **No behavior changes**. No new lazy boundaries, no removed routes, no chunk-naming customizations beyond what vite already does per-`import()`.

## Out of scope

- Retiring the `src/components/dashboard/*` barrel files (Phase 8). They remain as the legacy import surface for any non-Dashboard consumer.
- Typed `*Api` wrappers around `functions.invoke` (Phase 9).
- Mobile-only render path changes, RBAC redesign, or visual chrome edits.
- Splitting `AdminSidebar.tsx` (563 LOC) into per-group config — separate refactor.

## Verification

- `tsc` clean.
- All 146 routes render at `/dashboard?tab=<key>`. Spot-check one from each domain group: `overview`, `crm-overview`, `jobs-overview`, `learning-academies`, `marketing-channels`, `gigs-overview`, `finops-overview`, `abroad-overview`, `agents-overview`, `inst-overview`, `ir-dashboard`, `hr-workforce`, `ugc-feed`.
- `wc -l src/pages/Dashboard.tsx` → ≤120 LOC (down from 585).
- `find src/shells/admin/routes -name '*.ts' | xargs wc -l | tail -1` → ~600 LOC distributed across ~16 files (avg ~40 LOC each).
- `rg "@/components/dashboard/" src/shells/admin/routes/` → 0 (all lazy targets point at `@/domains/<X>` directly).
- Dev tools Network tab: navigating between groups produces distinct JS chunks named after the domain (vite default behavior, but worth eyeballing once).
- No console errors on initial mount; tab-switch shows correct title in browser tab + sidebar selected state.

## Risk

Low. Pure registry refactor — no new behavior, no API surface changes. The one trap is the parametric overview routes (`overview-month`, `overview-quarter`, `overview-year`) which wrap `<PeriodOverviewTab mode="…" />` inside the `.then()` — copy those verbatim and they keep working. Multi-alias resolvers (`m.X ?? m.Manager ?? m.default`) must be preserved per-route.

## Progress after Phase 7

**~97%.** `Dashboard.tsx` thin; admin route map is per-domain and points at canonical domain paths. Remaining:
```text
Phase 8  retire src/components/dashboard/* barrels — migrate the few non-Dashboard consumers (TalentDetailDialog, LinkedInJsonUpload, SimpleAdminRegistry, etc.) to @/domains/* / @/platform/admin, then delete the barrel files
Phase 9  typed *Api wrappers around remaining ~30 functions.invoke call sites across admin surfaces
```
