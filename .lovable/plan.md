## Phase 5.4 — `abroad` domain vertical slice

Small, clean phase: 3 talent components + 8 admin tabs + 1 admin hook + 2 edge contracts. No talent-side hooks live in `src/hooks/` for this domain.

### Scope

**Talent UI → `src/domains/abroad/components/talent/` (+ barrels at `src/components/abroad/*`)** — 3 files
- `RoadmapBuilderSheet`
- `RoadmapIntakeForm`
- `RoadmapTimeline`

**Admin UI → `src/domains/abroad/components/admin/` (+ barrels at `src/components/dashboard/abroad/*`)** — 8 files + 1 hook
- `AbroadApplicationsTab`, `AbroadDestinationsTab`, `AbroadIELTSPromptsTab`, `AbroadIELTSResourcesTab`, `AbroadLanguageLabTab`, `AbroadOverviewTab`, `AbroadProgramsTab`, `AbroadRoadmapLeadsTab`
- `hooks/useAbroadGraph.ts`

**Typed edge contracts → `src/edge/contracts/abroad.ts`**
- `ai-destination-agent`
- `generate-study-roadmap`

**API manifest → `src/domains/abroad/api/manifest.ts`**
- `abroadApi.{aiDestinationAgent, generateStudyRoadmap}`

**Domain index → `src/domains/abroad/index.ts`**
Re-export the 3 talent components + `abroadApi`.

**F3 sweep**
Replace 2 direct `supabase.functions.invoke` calls in `RoadmapBuilderSheet` and `RoadmapIntakeForm` with `abroadApi.*`.

### Verification
- Type-check passes.
- `/app/study-abroad`, `/app/study-abroad/roadmap`, `/dashboard/abroad` tabs still mount.

### Out of scope
- IELTS/coach page logic stays in `src/pages/app/`; only components/api move.
- `admin-support-assistant` cross-cutting anomaly invokes from page files (not abroad-specific) stay as-is.
- Hooks: none currently live under `src/hooks/` for abroad.
- Phases 6–9 still deferred.

### Risk
- Low. 12 files, 2 edge fns, no `useTalent`-style shared hook entanglement.

### Progress after 5.4
~43%. Next: 5.5 messaging.

### Roadmap remainder
```text
5.5  messaging
5.6  companies
5.7  marketing
5.8  ir
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```

---

## Phase 5.4 — COMPLETE

- 3 talent components → `src/domains/abroad/components/talent/` (+ barrels)
- 8 admin tabs + `useAbroadGraph` → `src/domains/abroad/components/admin/[hooks/]` (+ barrels)
- `src/edge/contracts/abroad.ts` + `src/domains/abroad/api/manifest.ts` (`abroadApi.{aiDestinationAgent, generateStudyRoadmap}`)
- F3 sweep: 2 direct invokes replaced (RoadmapBuilderSheet, RoadmapIntakeForm)
- Verification: no remaining `functions.invoke` outside manifest; intra-imports clean

Progress ~43%. Next: 5.5 messaging.
