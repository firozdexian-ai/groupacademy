## Phase 5.12 — `ugc` domain vertical slice

Clean small phase. Zero edge functions. Only consumer is `src/pages/Dashboard.tsx`. 4 of 5 tabs import the shared `ConfirmPurge` via relative paths.

### Scope

**5 admin UI → `src/domains/ugc/components/admin/` (+ barrels at `src/components/dashboard/ugc/*`)**
- `UgcOverviewTab` (default + named)
- `UgcFeedTab` (default + named)
- `UgcVideosTab` (default + named)
- `UgcCompetitionsTab` (default + named)
- `UgcBlogTab` (default + named)

**1 hook → `src/domains/ugc/components/admin/hooks/` (+ barrel at `src/components/dashboard/ugc/hooks/useUgcGraph.ts`)**
- `useUgcGraph`

**Import rewrite** (4 files)
- `UgcFeedTab`, `UgcVideosTab`, `UgcCompetitionsTab`, `UgcBlogTab`: `"../common/ConfirmPurge"` → `"@/components/dashboard/common/ConfirmPurge"`.

**Edge contract → `src/edge/contracts/ugc.ts`**
- `UgcEdgeContracts = Record<string, never>` (no edge functions today).

**API manifest → `src/domains/ugc/api/manifest.ts`**
- `ugcApi = {} as const` stub.

**Domain index → `src/domains/ugc/index.ts`**
- Re-export the 5 tabs + hook + `ugcApi`.

**F3 sweep** — none (0 `functions.invoke` in the source tree).

### Importers kept stable via barrels
- `src/pages/Dashboard.tsx` continues importing `@/components/dashboard/ugc/*` unchanged.

### Verification
- Type-check passes.
- `/dashboard` UGC & Contents tabs (Overview / Feed / Videos / Competitions / Blog) mount and `ConfirmPurge` opens.
- `rg "functions.invoke" src/domains/ugc/` → 0.

### Out of scope
- UGC chat agents (live in `dashboard/chat`, handled later).
- Public talent-feed surface (already in `domains/feed`).
- Phases 6–9.

### Risk
- Low. 6 files, no edge calls, single consumer, 4 trivial path rewrites.

### Progress after 5.12
~71%. Next: 5.13 dashboard residuals (jobs/agents/learning/abroad/gigs/messaging/performance/overview/gtm/chat admin slices still under `src/components/dashboard/*`).

### Roadmap remainder
```text
5.13 dashboard residuals
Phase 6  platform/ extraction (notifications, etc.)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```
