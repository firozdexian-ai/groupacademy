## Phase 5.10 — `institutions` domain vertical slice

Small, clean phase. Zero edge functions; all persistence is direct table/RPC calls. Only consumer is `src/pages/Dashboard.tsx`.

### Scope

**4 admin UI → `src/domains/institutions/components/admin/` (+ barrels at `src/components/dashboard/institutions/*`)**
- `InstitutionsOverviewTab`
- `InstitutionTypesManager`
- `InstitutionChildRegistry`
- `StakeholderRegistry`

**1 hook → `src/domains/institutions/components/admin/hooks/` (+ barrel at `src/components/dashboard/institutions/hooks/useInstitutionGraph.ts`)**
- `useInstitutionGraph`

**Edge contract → `src/edge/contracts/institutions.ts`**
- `InstitutionsEdgeContracts = Record<string, never>` (reserved namespace; no edge functions today).

**API manifest → `src/domains/institutions/api/manifest.ts`**
- `institutionsApi = {} as const` stub.

**Domain index → `src/domains/institutions/index.ts`**
- Re-export the 4 tabs + the hook + `institutionsApi`.

**F3 sweep**
- None — `rg "functions.invoke" src/components/dashboard/institutions/` returns 0.

### Importers kept stable via barrels
- `src/pages/Dashboard.tsx` continues importing `@/components/dashboard/institutions/*` unchanged.

### Verification
- Type-check passes.
- `/dashboard` Institutions group tabs (Overview / Types / Child Registry / Stakeholders) mount.
- `rg "functions.invoke" src/domains/institutions/` → 0.

### Out of scope
- The 2 institutions chat agents (live in `dashboard/chat`, handled later).
- Public university/partner pages.
- Phases 6–9.

### Risk
- Low. 5 files, no edge calls, single consumer.

### Progress after 5.10
~65%. Next: 5.11 workforce.

### Roadmap remainder
```text
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, etc.)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```
