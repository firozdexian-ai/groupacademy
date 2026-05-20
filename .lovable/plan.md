## Phase 9f — Learning domain edge function hardening ✅ COMPLETE

**Outcome:** 17 learning edge functions hardened. `src/edge/contracts/learning.ts` + `src/domains/learning/api/learningApi.ts` shipped; `manifest.ts`/`index.ts` are now barrels (legacy `learningApi` const removed). All in-domain hooks (9) and components (3) migrated to named imports. Cross-domain callers `useTalentMirror`, `AIScenarioPlayer`, `InstructorReviewQueue`, and `AssessStage` migrated. `AIChatPanel` (SSE streaming) and 3 Postgres RPCs documented in drift doc as intentional exclusions. `tsc` clean; `rg "supabase.functions.invoke" src/domains/learning` returns 0 hits outside `learningApi.ts`; `rg "learningApi\."` returns 0 hits.

**Next:** Phase 9g — combine the remaining small domains (gigs, profile, finance, messaging, marketing) into a single sweep, then introduce the ESLint guard banning raw `supabase.functions.invoke` outside `src/domains/*/api/*.ts`.

---

## Phase 9f — original plan (kept for reference)


Apply the pilot pattern (talent/agents/jobs/abroad) to the **learning** domain. This is the largest remaining domain and the next-best ROI step.

### Why learning next

Remaining unmigrated domains by call-site density:

| Domain | Files w/ raw `invoke` | Distinct edge fns | Notes |
|---|---|---|---|
| **learning** | 12 (manifest + 3 components + 8 hooks) | **15** | Largest blast radius; some functions missing from manifest |
| gigs | 1 (manifest only) | 4 | Already partially typed |
| profile | 3 (manifest + 2 hooks) | 4 | Small |
| finance | 1 (manifest only) | 3 | Small |
| messaging | 2 (manifest + 1 component) | ~5 | Small |
| marketing | 1 (manifest only) | 1 | Trivial |

Learning has the most callers, the most contract drift risk, and several functions invoked from hooks/components that aren't in the existing manifest at all.

### Scope — 15 edge functions to harden

Already in `src/edge/contracts/learning.ts` + manifest (need pattern refresh):
- `ai-instructor-chat`, `ai-item-apply`, `ai-item-rewrite`, `ai-item-translate`, `authoring-review-digest`, `instructor-item-analytics`, `learner-adaptive-sample`, `learner-next-actions`, `learner-quiz-pool`, `learner-scenario-evaluate`, `learner-scenario-pool`, `learner-talent-mirror`, `get-track-progress`, `get-tutor-mastery-context`

New (currently called raw from hooks/components — add to contracts):
- `learner-review-queue` (`useReviewQueue.ts`)
- `learner-mastery-summary` (`useMasterySummary.ts`)
- `issue-skill-credentials` (`useSkillCredentials.ts`)
- `create-instructor-job-from-brief` (`useCourseBriefs.ts`)
- `ai-item-translate-apply` (`useItemTranslate.ts`)

### Steps

1. **Audit + expand `src/edge/contracts/learning.ts`** — verify the existing 12 contracts still match real call sites; add Zod schemas + Request interfaces for the 5 functions above. Use `.passthrough()` everywhere.

2. **Create `src/domains/learning/api/learningApi.ts`** — one named async wrapper per edge function (~17 total) using the hardened pattern: `supabase.functions.invoke` → `EdgeFunctionError` → `parseEdgeResponse`. No local `invoke` helper, no `learningApi` const.

3. **Convert `src/domains/learning/api/manifest.ts` and `index.ts` to barrels** — re-export from `learningApi.ts`; delete the legacy `learningApi` const.

4. **Migrate in-domain call sites (12 files):**
   - **Hooks (8):** `useCourseBriefs`, `useItemAnalytics`, `useItemRewrite`, `useItemTranslate`, `useMasterySummary`, `useModuleReviewBadge`, `useNextActions`, `useReviewQueue`, `useSkillCredentials`
   - **Components (3):** `ModuleQuizRunner`, `ModuleScenarioRunner`, `ReviewQueueRunner`
   - Each switches from `learningApi.foo(...)` (or raw `supabase.functions.invoke`) to named imports from `@/domains/learning/api/learningApi`.

5. **Migrate cross-domain learning callers** (out-of-domain pages calling learning fns directly) — quick `rg` sweep to confirm none exist outside `src/domains/learning`, otherwise extend the file list. Initial scan suggests `InstructorReviewQueue.tsx`, `JobAssessment.tsx`, `JobAssessmentResults.tsx`, `AssessmentResults.tsx` may also hit learning fns — confirm during execution and migrate.

6. **Update `src/edge/README.md`** — add learning ownership row with all 17 function names.

7. **Update `.lovable/known-edge-contract-drift.md`** — log any drift found while expanding contracts (e.g. camelCase vs snake_case, missing-on-disk functions).

8. **Verify** —
   - `tsc` clean
   - `rg "supabase.functions.invoke" src/domains/learning` returns 0 hits outside `learningApi.ts`
   - `rg "learningApi\."` returns 0 hits repo-wide (named imports only)

9. **Mark Phase 9f ✅ in `.lovable/plan.md`** and queue Phase 9g (gigs + profile combo — both small).

### Out of scope
- Other domains (gigs/profile/finance/messaging/marketing) — separate phases.
- ESLint tooling guard (deferred until all domains migrated).
- Fixing the drift entries listed in `.lovable/known-edge-contract-drift.md` — Phase 9 preserves runtime behavior only.
