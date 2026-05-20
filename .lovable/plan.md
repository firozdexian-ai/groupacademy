# Phase 5.13c — Talent admin extraction (final dashboard residual)

Last residual under `src/components/dashboard/`: the **talent** folder. 14 files, ~4,476 LOC of real source code with 4 `functions.invoke` calls and 3 relative `../` imports. No `src/domains/talent/` directory exists yet — Phase 5.13c creates it from scratch.

## Inventory

| File | LOC | Invokes | Notes |
|---|---|---|---|
| `BatchTalentUpload.tsx` | 653 | 2 (`batch-parse-cvs`) | Largest file |
| `PortfolioRequestsTab.tsx` | 538 | 0 | 1 relative import |
| `LinkedInJsonUpload.tsx` | 354 | 0 | Used by IR domain |
| `TalentDetailDialog.tsx` | 351 | 0 | Used by 3 marketing leads + jobs assessments |
| `SupportAITab.tsx` | 349 | 1 (`ai-support-assistant`) | |
| `TalentPoolTab.tsx` | 344 | 0 | 1 relative import |
| `ProfessionsTab.tsx` | 383 | 0 | 1 relative import |
| `ProfessionalRolesPanel.tsx` | 308 | 0 | Used by ProfessionsTab |
| `TalentOverviewTab.tsx` | 286 | 0 | |
| `CreatorEconomyTab.tsx` | 281 | 0 | |
| `NotificationsTab.tsx` | 275 | 0 | |
| `TalentOutreachConsoleTab.tsx` | 239 | 1 (`generate-outreach-message`) | |
| `TalentUploadTab.tsx` | 98 | 0 | Wraps BatchTalentUpload |
| `TalentMessagingChannelTab.tsx` | 17 | 0 | Tiny stub |

**Edge functions invoked**: `batch-parse-cvs` (×2), `ai-support-assistant`, `generate-outreach-message` → 3 distinct functions.

**Relative `../` imports to rewrite**:
- `ProfessionsTab` → `../DashboardSkeleton` → `@/platform/admin` (Phase 6 path)
- `TalentPoolTab` → `../DashboardSkeleton` → `@/platform/admin`
- `PortfolioRequestsTab` → `../DashboardSkeleton` → `@/platform/admin`

**Cross-domain consumers** (must keep working via barrels):
- `pages/Dashboard.tsx` — 10 `React.lazy()` imports into talent files
- `domains/jobs/components/admin/JobsAssessmentLeadsTab.tsx` → `TalentDetailDialog`
- `domains/marketing/components/admin/leads/{SalaryAnalysis,MockInterview,LeadHunter}Manager.tsx` → `TalentDetailDialog`
- `domains/ir/components/admin/InvestorsManager.tsx` → `LinkedInJsonUpload`

## Target layout

```text
src/domains/talent/
  api/manifest.ts
  components/admin/
    BatchTalentUpload.tsx
    CreatorEconomyTab.tsx
    LinkedInJsonUpload.tsx
    NotificationsTab.tsx
    PortfolioRequestsTab.tsx
    ProfessionalRolesPanel.tsx
    ProfessionsTab.tsx
    SupportAITab.tsx
    TalentDetailDialog.tsx
    TalentMessagingChannelTab.tsx
    TalentOutreachConsoleTab.tsx
    TalentOverviewTab.tsx
    TalentPoolTab.tsx
    TalentUploadTab.tsx
  index.ts

src/edge/contracts/talent.ts   // shells for batch-parse-cvs, ai-support-assistant, generate-outreach-message
```

## Scope

1. **Create** `src/domains/talent/` skeleton (`api/manifest.ts`, `index.ts`).
2. **Copy** each of the 14 files to `src/domains/talent/components/admin/`.
3. **Rewrite the 3 relative imports** to `@/platform/admin` (DashboardSkeleton helpers now live there per Phase 6).
4. **Rewrite intra-folder absolute imports** to point at the new domain (`ProfessionsTab` → `ProfessionalRolesPanel`, `TalentUploadTab` → `BatchTalentUpload`).
5. **Replace each `src/components/dashboard/talent/*.tsx`** with a one-line barrel re-exporting from the new domain path. Preserve every existing named export (`TalentOverviewTab`, `TalentPoolTab`/`TalentPoolManager`, `ProfessionsTab`/`ProfessionsManager`, `NotificationsTab`/`NotificationsManager`, `SupportAITab`/`SupportAssistant`, `PortfolioRequestsTab`/`PortfolioRequestsManager`, etc. — `Dashboard.tsx` falls back to multiple alias names).
6. **Create** `src/edge/contracts/talent.ts` with typed request/response shells for the 3 distinct functions (request bodies typed, response bodies `Record<string, unknown>` matching the established marketing/jobs pattern).
7. **Extend** `src/domains/talent/index.ts` to re-export every admin tab (default + all named variants) and the dialog.
8. **Leave consumer imports untouched** — every existing `@/components/dashboard/talent/...` path keeps working via the new barrel layer. Phase 8 will retire those barrels.

## Out of scope

- Migrating any of the 4 `functions.invoke` call sites to a typed `talentApi.*` wrapper (Phase 9 — the contract file is the prep).
- Splitting `BatchTalentUpload.tsx` (653 LOC, the largest residual) into smaller components.
- Moving `pages/Dashboard.tsx` lazy imports to the new `@/domains/talent` path (cosmetic — done in Phase 8 alongside the other barrel retirements).
- Phases 7–9.

## Verification

- `tsc` clean.
- `/dashboard` CRM group: Overview / Talent Pool / Professions / Upload / Outreach / WA Channel / Creator Economy / Notifications / Support AI / Portfolios all mount.
- `TalentDetailDialog` opens from Jobs Assessment Leads, Salary Analysis Leads, Mock Interview Leads, Lead Hunter, and IR.
- `LinkedInJsonUpload` opens from IR Investors Manager.
- `BatchTalentUpload` (within `TalentUploadTab`) parses CVs.
- `rg "from ['\"]\\.\\." src/domains/talent/components/admin/` → 0.
- `rg "functions.invoke" src/domains/talent/components/admin/ | wc -l` → 4 (unchanged; wrapper migration is Phase 9).
- `find src/components/dashboard -maxdepth 2 -name '*.tsx' | xargs wc -l | awk '$1>10 && $2!="total"'` → empty (all residual source moved out of `components/dashboard/`).

## Risk

Medium-low. Largest single-folder migration (14 files, ~4,476 LOC) and crosses 5 other domains via `TalentDetailDialog` + `LinkedInJsonUpload`, but every consumer keeps its current import string via barrels — zero call-site edits. Multiple named-export aliases per file (`TalentPoolTab` vs `TalentPoolManager`) need to be preserved exactly so `Dashboard.tsx`'s `m.X ?? m.Y ?? m.default` fallbacks keep resolving.

## Progress after Phase 5.13c

**~95%.** All admin source lives under `src/domains/<X>/components/admin/` or `src/platform/admin/`. Remaining phases:
```text
Phase 7  shells/admin/routes.tsx + React.lazy code-splitting consolidation
Phase 8  retire src/components/dashboard/* barrels — consumers import from @/domains/* and @/platform/admin
Phase 9  typed *Api wrappers (talentApi, jobsApi, marketingApi, …) around remaining functions.invoke call sites
```
