## Phase 5.13b — Jobs admin extraction (final dashboard residual)

Survey discovery: **abroad, agents, gigs, learning, and marketing are already migrated** (every `dashboard/<folder>/*` file is a 1–3-line barrel pointing at its domain). Only **`dashboard/jobs/`** still contains source — 25 admin files totaling ~5,300 LOC, with 7 `functions.invoke` sites and 5 relative `../` imports.

### Inventory

| Source path | Files | LOC | Invokes |
|---|---|---|---|
| `dashboard/jobs/*.tsx` | 11 | ~3,100 | 1 |
| `dashboard/jobs/hub/*.tsx` | 10 | ~3,100 | 5 |
| `dashboard/jobs/codes/*.tsx` | 3 | ~670 | 0 |
| `dashboard/jobs/hooks/useJobsGraph.ts` | 1 | 100 | 0 |

**Edge functions invoked**: `enhance-job-description` ×2, `score-job-match` ×2, `parse-cv`, `generate-job-share-caption`, `parse-job-post`.

**Relative `../` imports to rewrite**:
- `hub/JobsManageTab` → `../../DashboardSkeleton` → `@/components/dashboard/DashboardSkeleton`
- `hub/JobsApplicationsTab` → `../../DashboardSkeleton` → `@/components/dashboard/DashboardSkeleton`
- `JobsAssessmentLeadsTab` → `../DashboardSkeleton`, `../talent/TalentDetailDialog` → `@/components/...` + `@/domains/talent/components/admin/TalentDetailDialog` (verify path)
- `JobsManagerLegacyTab` → `../DashboardSkeleton` → `@/components/dashboard/DashboardSkeleton`

### Target layout

```
src/domains/jobs/components/admin/
  hooks/useJobsGraph.ts
  JobsApplicationsTab.tsx
  JobsAssessmentLeadsTab.tsx
  JobsAssessmentsTab.tsx
  JobsKanbanPipelineTab.tsx
  JobsKpiTab.tsx
  JobsLinkedInBatchUpload.tsx
  JobsManagerLegacyTab.tsx
  JobsOverviewTab.tsx
  JobsSourcingTab.tsx
  JobsTalentCrmTab.tsx
  JobsUploadApprovalTab.tsx
  codes/
    AssessmentCodeGenerator.tsx
    JobApplicationCodeGenerator.tsx
    StandaloneAssessmentCodeGenerator.tsx
  hub/
    AIRelevanceScore.tsx
    AddExternalApplicationDialog.tsx
    ChannelPromotionCard.tsx
    JobFormDialog.tsx
    JobsApplicationsTab.tsx
    JobsHub.tsx
    JobsManageTab.tsx
    JobsOutreachTab.tsx
    JobsUploadTab.tsx
    PendingJobSubmissions.tsx
```

### Scope

1. **Copy** each source file to the new admin path; leave existing `domains/jobs/components/*` talent files untouched.
2. **Replace originals** with barrels (`export { default, NamedX } from "@/domains/jobs/components/admin/..."` or `export * from "..."` for hooks).
3. **Rewrite the 5 relative imports** noted above to `@/`-aliased paths in their new domain locations.
4. **Create `src/edge/contracts/jobs.ts`** with typed request/response shells for the 5 distinct functions (`enhance-job-description`, `score-job-match`, `parse-cv`, `parse-job-post`, `generate-job-share-caption`). Use `Record<string, unknown>` for response bodies that aren't yet documented — matches the marketing-contract pattern.
5. **Extend `src/domains/jobs/index.ts`** to re-export the new admin tabs (default + named) and the hook. Leave existing talent exports alone.
6. **Keep `pages/Dashboard.tsx` imports unchanged** — barrels preserve every consumer path.

### Out of scope
- Refactoring the duplicated `JobsApplicationsTab` (one in `jobs/`, one in `jobs/hub/`) — keep both, just move them.
- Migrating any of the 7 `functions.invoke` call sites to a typed `jobsApi.*` wrapper (Phase 9 work — contract file is the prep).
- Renaming `domains/agents/components/dashboard` → `admin` for consistency (cosmetic, deferred).
- Phases 6–9 (platform extraction, route shells + lazy, barrel retirement, full edge wrapper rollout).

### Verification
- `tsc` clean.
- `/dashboard` Jobs group: Overview / KPI / Sourcing / Applications / Kanban / Assessments / Assessment Leads / Talent CRM / Upload Approval / LinkedIn Batch Upload / Manager Legacy all mount.
- `/dashboard` Jobs Hub subtabs: Manage / Applications / Upload / Outreach / Pending Submissions render; `JobFormDialog` opens; `AIRelevanceScore` fetches; `AddExternalApplicationDialog` parses CV.
- Code-generator dialogs in `codes/` open and produce output.
- `rg "from ['\"]\\.\\." src/domains/jobs/components/admin/` → 0.
- `rg "functions.invoke" src/domains/jobs/components/admin/ | wc -l` → 7 (unchanged; wrapper migration is Phase 9).

### Risk
- Medium. Largest residual (25 files, ~5,300 LOC) and the only one with real edge calls. Talent-side `domains/jobs` already exists, so we must be careful not to collide with existing file names (none of the admin filenames overlap — confirmed).

### Progress after 5.13b
**~85%.** All admin shells live under `src/domains/<X>/components/admin/`. Remaining phases:
```text
Phase 6  platform/ extraction (shared notifications, layout chrome, RBAC primitives)
Phase 7  shells/*/routes.tsx + React.lazy code-splitting
Phase 8  retire src/components/dashboard/* barrels (consumers import from @/domains/*)
Phase 9  typed jobsApi/etc. wrappers around remaining functions.invoke sites
```
