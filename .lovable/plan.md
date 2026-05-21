## Phase 10f — Companies Domain Repo Extraction

Following the same pattern used in 10c/10d/10e (Learning, Talent, Profile), this phase establishes a repository layer for the Companies domain and retires the legacy `src/hooks/useCompan*` re-export shims.

### Goals
1. Add `src/domains/companies/repo/companiesRepo.ts` as the only `supabase.from(...)` caller in the domain.
2. Refactor 1 hook + 6 admin components to go through it.
3. Delete 3 legacy hook shims in `src/hooks/`.

### Scope

**New repo — `src/domains/companies/repo/companiesRepo.ts`**, typed helpers grouped by surface:

- **Companies CRUD** (`CompaniesTab`, `BatchCompanyUpload`, `IndustriesTab`) — `listCompanies`, `searchCompanies`, `upsertCompany`, `updateCompany`, `deleteCompany`, `findCompaniesByDomain`
- **Contacts** (`ContactsTab`, `BatchCompanyUpload`) — `listContactsForCompany`, `insertContact`, `upsertContactsBatch`, `updateContact`, `deleteContact`
- **Outreach log** (`CompaniesTab`) — `listContactOutreach`, `countOutreachForCompany`
- **Company agents** (`CompanyAgentsTab`) — `listAiAgents`, `listCompanyAgents`, `assignAgentToCompany`, `removeCompanyAgent`, `toggleCompanyAgent`
- **Contact unlocks** (`ContactUnlocksTab`) — `listContactUnlocks`, joined with companies + talents helpers
- **Followed companies** (`useFollowedCompanies`) — `listFollowedCompanies`, `followCompany`, `unfollowCompany`

Storage (logos, CSV uploads) stays in components — repo only owns table I/O.

**Files to refactor** (10 raw `supabase.from` call sites across 7 files):
- `src/domains/companies/hooks/useFollowedCompanies.ts` (2)
- `src/domains/companies/components/admin/CompaniesTab.tsx` (4)
- `src/domains/companies/components/admin/CompanyAgentsTab.tsx` (6)
- `src/domains/companies/components/admin/ContactsTab.tsx` (2)
- `src/domains/companies/components/admin/ContactUnlocksTab.tsx` (3)
- `src/domains/companies/components/admin/IndustriesTab.tsx` (1)
- `src/domains/companies/components/admin/BatchCompanyUpload.tsx` (3)

`useCompaniesWithSignal` and `useCompanyDetail` already route through edge functions / are clean — quick audit only.

**Legacy shims to delete** in `src/hooks/`:
- `useCompaniesWithSignal.ts` (1-line re-export)
- `useCompanyDetail.ts` (1-line re-export)
- `useFollowedCompanies.ts` (1-line re-export)

**Codemod**: sed-pass across `src/**` rewriting `@/hooks/useCompaniesWithSignal`, `@/hooks/useCompanyDetail`, `@/hooks/useFollowedCompanies` → `@/domains/companies/hooks/*`.

### Out of scope
- `src/domains/companies/api/*` (already edge-routed).
- ESLint `NO_RAW_FROM` rule — Phase 10j.

### Execution
1. Scaffold `src/domains/companies/repo/companiesRepo.ts`.
2. Rewrite 1 hook + 6 admin components to call repo helpers.
3. Codemod imports; delete 3 shim files in `src/hooks/`.
4. Verify: `rg "supabase\.from" src/domains/companies/ src/hooks/useCompan* src/hooks/useFollowedCompanies*` returns only `companiesRepo.ts`; `tsc --noEmit` clean.
5. Smoke: admin Companies tabs (list, edit, agents, contacts, unlocks, industries), batch upload, talent "Follow Company" toggle.

### After 10f
- **10g** — Gigs domain final sweep (partially done in earlier phases).
- **10h** — Feed + Messaging domains.
- **10j** — ESLint `NO_RAW_FROM` rule to lock cleaned domains (Learning, Talent, Profile, Companies, Jobs, Gigs).

Reply to approve and I'll start with the repo scaffold.
---

## Phase 10f Status — Done

Completed:
- `src/domains/companies/repo/companiesRepo.ts` scaffolded with helpers for companies, contacts, contact_outreach, company_agents, ai_agents (admin views), company_agent_leads, talent_contact_unlocks, talents lookup, and followed_companies.
- Refactored 7 call sites: `useFollowedCompanies`, `CompaniesTab`, `CompanyAgentsTab`, `ContactsTab`, `ContactUnlocksTab`, `IndustriesTab`, `BatchCompanyUpload`.
- Codemod swept `@/hooks/useCompaniesWithSignal|useCompanyDetail|useFollowedCompanies` imports to `@/domains/companies/hooks/*`.
- Deleted 3 legacy shim files in `src/hooks/`.
- Verification: `rg "supabase\.from" src/domains/companies/` returns only `companiesRepo.ts`.

Next: **10g** Gigs domain final sweep.
