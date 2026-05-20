## Phase 5.6 — `companies` domain vertical slice

Compact admin-heavy phase. Companies are surfaced to talents through the jobs hub (Phase 3.2 — `CompanyCard`, `CompanyDetailSheet` already live in `domains/jobs`), so the talent-facing UI stays in `domains/jobs`. This phase extracts the admin/CRM surface plus the 3 read hooks that power both.

### Scope

**Hooks → `src/domains/companies/hooks/` (+ barrels at `src/hooks/*`)** — 3 files
- `useCompaniesWithSignal`
- `useCompanyDetail`
- `useFollowedCompanies`
- Note: `useEmployerPipeline` already lives in `domains/jobs/hooks/`; leave it there.

**Admin UI → `src/domains/companies/components/admin/` (+ barrels at `src/components/dashboard/companies/*`)** — 8 files
- `CompaniesOverviewTab`, `CompaniesTab`, `BatchCompanyUpload`
- `ContactsTab`, `ContactUnlocksTab`
- `IndustriesTab`
- `CompanyAgentsTab`
- `EmployerMessagingChannelTab` (wrapper around `MessagingChannelsTab` from `domains/messaging` — pure re-mount, no logic change)

**Edge contract → `src/edge/contracts/companies.ts`**
- Namespace reserved with documentation only — no `supabase.functions.invoke` calls exist in companies admin or hooks today. All server interaction is direct table reads + Postgres RPCs (`get_companies_with_signal`, `get_company_detail`).

**API manifest → `src/domains/companies/api/manifest.ts`**
- Empty `companiesApi = {}` stub for future edge functions, matching the pattern in `domains/feed`.

**Domain index → `src/domains/companies/index.ts`**
Re-export the 3 hooks, 8 admin components, and `companiesApi`.

**F3 sweep**
- No edge invokes to replace.
- Cross-domain `jobs` components that consume these hooks (`CompanyCard`, `CompanyDetailSheet`, `useJobsHubDashboard`, `Dashboard.tsx`) keep working via `@/hooks/*` barrels; no edits needed.

### Importers that keep working via barrels
- `src/pages/Dashboard.tsx` → admin tabs (re-exports resolve unchanged)
- `src/domains/jobs/hooks/useJobsHubDashboard.ts` → `useCompaniesWithSignal`/`useFollowedCompanies`
- `src/domains/jobs/components/CompanyCard.tsx` + `CompanyDetailSheet.tsx` → `useCompanyDetail`, `useFollowedCompanies`

### Verification
- Type-check passes.
- `/dashboard` Companies group tabs (Overview / Companies / Contacts / Contact Unlocks / Industries / Agents / Messaging) all mount.
- `/app/jobs` Companies tab + Company sheet still load.
- No remaining `functions.invoke(` calls in companies admin or hooks.

### Out of scope
- Talent-facing company UI in `domains/jobs` (CompanyCard, CompanyDetailSheet) — already extracted in Phase 3.2/J.
- Employer pipeline (`useEmployerPipeline`, kanban) — already in `domains/jobs`.
- Company offerings / credits / contact unlocks hooks under `src/gro10x/hooks/` — those belong to the gro10x shell, not this domain.
- Phases 6–9 still deferred.

### Risk
- Low. 11 files, 0 edge fns, only barrel re-exports. Cross-domain imports already use `@/hooks/*` paths.

### Progress after 5.6
~49%. Next: 5.7 marketing.

### Roadmap remainder
```text
5.7  marketing
5.8  ir
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, credits, payments)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```

---

## Phase 5.6 — completed

- 3 hooks moved to `src/domains/companies/hooks/` with barrels at `src/hooks/*`.
- 8 admin tabs moved to `src/domains/companies/components/admin/` with barrels at `src/components/dashboard/companies/*`.
- `EmployerMessagingChannelTab` updated to import `MessagingChannelsTab` from `@/domains/messaging/...`.
- 3 admin tabs (`CompaniesTab`, `ContactsTab`, `IndustriesTab`) had `../DashboardSkeleton` rewritten to absolute import.
- `src/edge/contracts/companies.ts` reserved (no edge fns today).
- `src/domains/companies/api/manifest.ts` stub created.
- `src/domains/companies/index.ts` re-exports hooks, admin components, and `companiesApi`.
- Verified zero `functions.invoke` in companies domain.
