## Phase 10j — App-level Sweep (pages, hooks, lib, components, contexts)

**Goal:** Eliminate every remaining raw `supabase.from(...)` call outside `src/domains/*/repo/` so that the ESLint guard (`no raw supabase.from outside repo/`) can be enabled project-wide at the end of the phase.

### Current surface (measured)

- **78 files / 147 call sites** remain across:
  - `src/pages/**` — 49 files (26 root + 23 `/app`)
  - `src/hooks/**` — 9 files
  - `src/components/**` — 9 files
  - `src/lib/**` — 4 files
  - `src/gro10x/**` — 5 files (1 hook, 1 component, 2 pages, +Feed)
  - `src/contexts/TalentContext.tsx`, `src/platform/admin/ui/SimpleAdminRegistry.tsx`

All 17 domain repos already exist. Phase 10j is **pure code motion** — no behavior changes, no new schema, no UI work.

### Execution model

Same pattern as 10g/10h/10i:
1. For each call site, identify the **owning domain repo** (e.g. `notifications` → talent, `tool_runs` → jobs, `discussion_posts` → learning).
2. Add a named helper to that repo if missing.
3. Replace the raw `.from()` call with the repo helper.
4. Leave `supabase.auth.*`, `supabase.rpc(...)`, `supabase.functions.invoke(...)`, `supabase.channel(...)` untouched.

### Sub-phases (sequenced smallest → largest, each independently shippable)

**10j.1 — Shared infrastructure (4 files, 6 sites)**
- `src/lib/databaseWarmup.ts`, `src/lib/emailNotifications.ts`, `src/lib/finalizePendingOnboarding.ts`, `src/lib/onboarding/telemetry.ts`
- Move into `talent/profile` repos (onboarding + warmup) and `messaging` repo (notifications).
- Validates the pattern before touching pages.

**10j.2 — `src/hooks/**` (9 files, ~15 sites)**
- `useDiscussions` → learning repo (lesson_questions, discussion_posts, submission_reviews)
- `useNotifications` → talent/messaging repo
- `useToolRuns` → jobs repo
- `useOffers`, `useInterviews` → jobs/companies repo
- `useOnboarding`, `useAccountType`, `useAdminScope` → profile/talent repo
- `useUnitEconomics` → finance repo

**10j.3 — `src/components/**` + contexts + platform (12 files, ~14 sites)**
- 9 leaf components (`AccessCodeDialog`, `LeadCaptureForm`, `AssessStage`, `GlobalAIBubble`, `ReferralCard`, `CompanyWhatsAppGroupCard`, `InboxUnlockCard`, 2 agent dialogs).
- `contexts/TalentContext.tsx` (3 talents reads) → talent repo.
- `platform/admin/ui/SimpleAdminRegistry.tsx` (2 sites) — generic CRUD; add tiny `genericAdminRepo` helpers or route via existing graph helpers.

**10j.4 — `src/gro10x/**` (5 files, ~10 sites)**
- `useCompanyOfferings` → companies repo
- `TelegramTopUpModal` → finance repo
- `Gro10xCRM`, `Gro10xFeed` → companies/feed repos
- `useGro10xCompanyId` (1 site already shown in earlier context) → companies repo

**10j.5 — `src/pages/**` non-app (26 files, ~50 sites)**
Grouped by domain to batch-edit:
- **Learning** (~10 files): QuizManagement, ModuleManagement, ModuleResourcesManager, ContentEdit, SessionEdit, CourseDetail, ImmersiveCoursePlayer, Instructors, LearningReview, AppCourses-adjacent
- **Marketing/Lead** (~6 files): MockInterviewSetup, SalaryAnalysisSetup, PortfolioRequest, PublicBlogPost, AccessCodeDialog flows
- **Admin shells** (~5 files): AdminLiveInbox, WorkforceCommandCenter (dashboard/), Dashboard
- **Misc/public** (~5 files): VerifyCertificate, VerifySkillCredential, etc.

**10j.6 — `src/pages/app/**` (23 files, ~50 sites)**
- **Profile/Talent** (~6): Profile, ProfileVerify, ProfileBuilder, TalentPublicProfile, TalentDirectory, SavedItems, MyResults
- **Jobs/Apps** (~4): MyApplications, AppPortfolioRequest, AppInterviewSchedule, Withdrawals
- **Gigs/Marketplace** (~3): MarketplaceGigDetail, MyGigs, NewGigWizard
- **Abroad** (~3): StudyAbroadDetail, AbroadHub, AbroadApplications
- **Learning/Instructor** (~4): InstructorReviewQueue, AppMyLearning, AppTrackDetail, AppSessionJoin
- **Misc** (~3): Notifications, Messages, MessageThread

**10j.7 — Repo whitelist enforcement (final gate)**
- Add ESLint rule: `no-restricted-syntax` matching `CallExpression[callee.object.name="supabase"][callee.property.name="from"]` with allowlist for `src/domains/**/repo/**` and `src/integrations/supabase/**`.
- Wire it into the existing `eslint.config.js`.
- Run `bun run lint` — must pass with **0** violations.

### Acceptance gates (per sub-phase)

- `rg -n "supabase\.from" <scope> --glob '!**/repo/**'` returns **0** in that sub-phase's scope.
- TypeScript clean (harness runs `tsc --noEmit`).
- File diff is repo-add + call-site swap only — no JSX, query-key, or toast text changes.
- Final 10j.7 gate: full project `bun run lint` passes with the new rule.

### Why this ordering

- **Smallest first** (lib → hooks → components) so we validate repo gaps before touching the noisy page batch.
- **Pages last and grouped by domain** so each PR sized commit touches one repo + N call sites, never crossing domains.
- **ESLint rule last** because it can't be enforced until the codebase is clean — otherwise it blocks the cleanup itself.

### Out of scope (Phase 10k+)

- Edge function `.from` calls (different ESLint scope, different review).
- `supabase.rpc` → typed RPC wrappers (separate phase; already partially done in domain repos).
- Behavior changes, query consolidation, RLS audits.

### Recommended start

Begin with **10j.1** (4 files, 6 sites — done in one pass). Then **10j.2** immediately after if it stays clean. The big batches (10j.5 / 10j.6) are best as their own turns so I can verify per-domain.
