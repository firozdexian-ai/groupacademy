# Phase 10d — Talent Domain Repo Extraction

Phase 10c is complete: `src/domains/learning/` is free of raw `supabase.from(...)` calls (only `learningRepo.ts` touches the client). Next domain to clean is **Talent**, which still has 7 hooks in the legacy `src/hooks/` folder and 10 admin components calling the client directly.

## Goals

1. Co-locate all talent data access under `src/domains/talent/`.
2. Funnel every `supabase.from('talents' | 'talent_*' | 'professions' | …)` call through a new `talentRepo.ts`.
3. Move the 7 stray talent hooks out of `src/hooks/` into the domain.
4. Keep behaviour identical — no UI, RLS, or schema changes.

## Scope

### Repo to create
`src/domains/talent/repo/talentRepo.ts` — typed helpers grouped by surface:

- **Admin pool & overview** (`TalentPoolTab`, `TalentOverviewTab`, `CreatorEconomyTab`, `PortfolioRequestsTab`)
  - `listTalentsForPool(filters)`, `getTalentOverviewStats()`, `listCreatorEconomyRows()`, `listPortfolioRequests()`
- **Professions & roles** (`ProfessionsTab` x4, `ProfessionalRolesPanel` x5)
  - `listProfessions`, `upsertProfession`, `deleteProfession`, `listProfessionLevels`, `listProfessionalRoles`, `upsertProfessionalRole`, `deleteProfessionalRole`, `reorderProfessionalRoles`
- **Importers** (`BatchTalentUpload` x3, `LinkedInJsonUpload` x2)
  - `bulkInsertTalents`, `findTalentByEmail`, `insertTalentLinkedInPayload`
- **Notifications & outreach** (`NotificationsTab` x2, `TalentOutreachConsoleTab`)
  - `listTalentNotifications`, `markNotificationRead`, `listOutreachCampaigns`

### Hooks to relocate `src/hooks/ → src/domains/talent/hooks/`
- `useTalent.ts`
- `useTalentLists.ts` (note: duplicate exists in `domains/profile/hooks/` — investigate and consolidate)
- `useTalentMirror.ts`
- `useTalentOutcomeSignal.ts`
- `useTalentPitches.ts`
- `useTalentRelationships.ts` (also dup in profile)
- `useTalentSearch.ts`

Each hook gets:
- Raw `supabase.from(...)` rewritten to `talentRepo` calls.
- New import path: `@/domains/talent/hooks/useX` (with re-export from `src/domains/talent/index.ts`).
- Codemod sweep of all `@/hooks/useTalent*` imports across the repo.

### Out of scope (handled in later phases)
- `domains/profile/hooks/useTalentLists.ts` / `useTalentRelationships.ts` — touched only enough to remove duplication; deeper profile cleanup deferred to **10e (Profile)**.
- ESLint `NO_RAW_FROM` guard rule — Phase **10j**.
- RPC-only paths (`get_public_talent_profile`, `score_talent_job_mastery`, etc.) — already clean.

## Execution Order

1. Scaffold `src/domains/talent/repo/talentRepo.ts` + `src/domains/talent/hooks/` dir.
2. Move + rewrite the 7 hooks; update `src/domains/talent/index.ts` exports.
3. Codemod imports across `src/**` (sed pass like 10c).
4. Refactor the 10 admin components to call repo functions.
5. `tsc --noEmit` + `rg "supabase\.from" src/domains/talent/ src/hooks/useTalent*` → expect only `talentRepo.ts`.
6. Smoke: Admin → Talent (Pool, Overview, Professions, Roles, Notifications, Creator Economy), Importers, and `/t/:handle` public profile.

## After 10d

- **10e** — Profile domain (`domains/profile/**`, dedup talent-list hooks).
- **10f** — Companies domain.
- **10j** — Add ESLint rule `NO_RAW_FROM` to lock in repo-only access across cleaned domains.

Ready to execute — reply to approve and I'll start with the repo scaffold.

---

## Phase 10d Status — Done (admin components)

Completed:
- `src/domains/talent/repo/talentRepo.ts` scaffolded with 20+ helpers across pool, notifications, outreach, portfolio requests, professions/roles, creator economy, overview, importers (CSV + LinkedIn JSON).
- Refactored 10 admin components: ProfessionsTab, ProfessionalRolesPanel, TalentPoolTab, PortfolioRequestsTab, TalentOutreachConsoleTab, NotificationsTab, TalentOverviewTab, CreatorEconomyTab, BatchTalentUpload, LinkedInJsonUpload.
- Verification: `rg "supabase\.from" src/domains/talent/` returns only `talentRepo.ts`; `tsc --noEmit` is clean.

Deferred from this phase:
- The 7 `src/hooks/useTalent*.ts` files are already thin re-exports of `src/domains/profile/hooks/useTalent*` — relocation will happen as part of **10e (Profile domain)** so the impls move + dedup together.
