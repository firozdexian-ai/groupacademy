## Phase 5.11 — `workforce` domain vertical slice

The "workforce" admin area lives under `src/components/dashboard/hr/` (named `hr` for legacy reasons; product surface is the Workforce group + HR ops). Six admin files + 1 hook. Zero edge functions. Only consumer is `src/pages/Dashboard.tsx`.

### Scope

**6 admin UI → `src/domains/workforce/components/admin/` (+ barrels at `src/components/dashboard/hr/*`)**
- `HrOverviewTab` (default + named)
- `WorkforceTab` → exports `WorkforceManager` (named only)
- `HrOnboardingTab` (default + named)
- `HrPayrollTab` (default + named)
- `HrTargetsTab` (default + named)
- `HrSimpleTabs` → exports `HrVerticalsTab`, `HrFunctionsTab`, `HrTeamsTab`, `HrGradesTab` (named only)

**1 hook → `src/domains/workforce/components/admin/hooks/` (+ barrel at `src/components/dashboard/hr/hooks/useHrGraph.ts`)**
- `useHrGraph`

**Import rewrite**
- `WorkforceTab.tsx` line 41: `../DashboardSkeleton` → `@/components/dashboard/DashboardSkeleton`.

**Edge contract → `src/edge/contracts/workforce.ts`**
- `WorkforceEdgeContracts = Record<string, never>` (reserved namespace; no edge functions today).

**API manifest → `src/domains/workforce/api/manifest.ts`**
- `workforceApi = {} as const` stub.

**Domain index → `src/domains/workforce/index.ts`**
- Re-export the 6 component files + hook + `workforceApi`.

**F3 sweep** — none (0 `functions.invoke` in the source tree).

### Importers kept stable via barrels
- `src/pages/Dashboard.tsx` continues importing `@/components/dashboard/hr/*` unchanged.

### Verification
- Type-check passes.
- `/dashboard` Workforce group tabs (Overview / Workforce / Onboarding / Payroll / Targets / Verticals / Functions / Teams / Grades) mount.
- `rg "functions.invoke" src/domains/workforce/` → 0.

### Out of scope
- Renaming the `hr` folder physically (kept as barrel-only shim — frees up Phase 8 to retire).
- Workforce chat agents (live in `dashboard/chat`, handled later).
- Phases 6–9.

### Risk
- Low. 7 files, no edge calls, single consumer, 1 relative-path rewrite.

### Progress after 5.11
~68%. Next: 5.12 ugc.

### Roadmap remainder
```text
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, etc.)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports (incl. hr/)
Phase 9  edge/contracts/ for every domain
```
