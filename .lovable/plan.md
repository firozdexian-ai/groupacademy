# Re-audit Profile/Talent + Refactor Jobs & Learning

## Part A — Profile + Talent carry-over (small)

Audit confirmed both domains are clean: no `console.log`, no TODO/FIXME, no `export *` leaks, no supabase leaks in components. Only one residual finding:

- `src/domains/talent/components/admin/SupportAITab.tsx` — 1 remaining raw `text-white`/`bg-black` site → map to `text-primary-foreground` / `bg-foreground`.

No other carry-over work required.

## Part B — Jobs domain refactor

### B1. Barrel hygiene
`src/domains/jobs/index.ts` currently uses 20+ `export *` lines. Rewrite as explicit named exports (hooks, components, api manifest) matching the ir/marketing/messaging/profile pattern.

### B2. Repository pattern (supabase leaks)
Move all direct `@/integrations/supabase` calls from components/hooks into `src/domains/jobs/repo/jobsRepo.ts`:

- `hooks/useApplicationMessages.ts` — queries + realtime subscription → `listApplicationMessages`, `sendApplicationMessage`, `subscribeToApplicationMessages`.
- `components/JobPreferencesSheet.tsx` — preferences read/write → `getJobPreferences`, `upsertJobPreferences`.
- `components/ScoreMeJobPicker.tsx` — jobs list query → `listJobsForScoring`.
- `components/admin/JobsLinkedInBatchUpload.tsx` — batch insert → `bulkInsertJobs`.
- `components/admin/hub/JobsOutreachTab.tsx` — outreach reads/writes → repo methods.
- `components/admin/hub/JobsManageTab.tsx` — admin job mutations → repo methods.
- `components/admin/hub/AIRelevanceScore.tsx` — score read/write → repo methods.
- `components/admin/JobsAssessmentLeadsTab.tsx` — leads queries → repo methods.

(`api/jobsApi.ts` keeps its `supabase.functions.invoke` calls — that is the legitimate edge boundary.)

### B3. UI token migration
Sweep raw palette colors in `src/domains/jobs/**` (blue/emerald/green/amber/orange/red/rose/indigo/violet/purple/fuchsia/cyan/slate) and map to semantic tokens:
- blue → `primary`
- emerald/green → `success`
- amber/orange → `warning`
- red/rose → `destructive`
- indigo/violet/purple/fuchsia/cyan → `accent`
- slate → `muted-foreground`
- raw `text-white` / `bg-black` → `text-primary-foreground` / `bg-foreground`

### B4. Preservation (must not change)
- Multi-currency rendering and `score_talent_job_mastery` boost in matching.
- Free per-card match% on Jobs Hub, `get_jobs_hub_dashboard` single-RPC contract.
- Hiring Loop kanban, `application_messages` realtime, `notify-application-status` edge.
- External-apply prep flow, Apply with AI assistant gating.
- VerifiedMatchBadge + WhyYouMatchPanel signal sources.

## Part C — Learning domain refactor

### C1. Barrel hygiene
`src/domains/learning/index.ts` has 50+ `export *` lines. Rewrite explicitly (hooks → components/talent → api). Keep the documented exclusion of Postgres RPCs from `api/manifest.ts`.

### C2. Repository pattern
Move direct `@/integrations/supabase` calls into `src/domains/learning/repo/learningRepo.ts`:

- Hooks: `useProgress.ts`, `useCourseBriefs.ts`, `useModuleResources.ts`, `useLearningTracks.ts`, `useInstructorWorkspace.ts` → add `getCourseProgress`, `listCourseBriefs`, `listModuleResources`, `listLearningTracks`, `getInstructorWorkspace*`, plus their mutations/subscriptions.
- Talent components: `MyCoursesTab.tsx`, `UnifiedDiscovery.tsx`, `TracksTab.tsx`, `CareerTracksPreview.tsx`, `EventsTab.tsx`, `CoursesTab.tsx` → call repo, not supabase directly.
- Admin components: `BulkResourceUpload.tsx`, `LearningB2BEngagementsTab.tsx`, `modules/ModulePickerPanel.tsx`, `modules/QuizResultsViewer.tsx` → repo methods.
- Remove the stray `console.log/debug` in `hooks/useCertificate.ts`.

`api/learningApi.ts` keeps its edge invokes.

### C3. UI token migration
Same semantic-token sweep as B3, applied across `src/domains/learning/**`.

### C4. Preservation (must not change)
- Item Bank analytics, multilingual sidecar, AI rewrite/translate flows.
- Cohorts + live sessions + attendance, Talent Mirror, Next-Best-Action.
- Verifiable Skill Credentials, certificate kinds, learning tracks.
- Instructor monetization (60/40 splits, payouts), course briefs → instructor jobs trigger.
- Gro10x B2B sponsorship modes (`free` / `company_credits` / `employee_credits`), org assignments, branded `/c/:slug/learn` catalog.
- AI Tutor mastery context injection, review queue flows.

## Verification (after each domain)
- `rg "@/integrations/supabase" src/domains/<domain>` → only `repo/` + `api/`.
- `rg "export \*" src/domains/<domain>/index.ts` → empty.
- `rg "text-white|bg-black"` and raw palette regex → empty in that domain.
- `rg "console\.(log|debug)"` and `rg "TODO|FIXME|HACK"` → empty.
- Build clean.

## Out of scope
No new tables, RLS, RPCs, edge functions, or feature changes. Bug-fixes only if surfaced incidentally.

## Next pair after this
`ugc` + `workforce` — final pair to close the refactor sweep.
