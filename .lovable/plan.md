# Phase 10c — Learning Domain: Hooks + Repo Consolidation

Continues Phase 10. After 10a (jobs) and 10b (gigs), this batch domainizes the **learning** surface: move the last real learning hook into the domain, route every `supabase.from(...)` inside `src/domains/learning/**` through a new `learningRepo.ts`, delete the 23 `src/hooks/` shims, and standardize all imports on `@/domains/learning`.

## Scope

In:
- All shims under `src/hooks/` that re-export from `src/domains/learning/hooks/`
- The one remaining real hook (`useAuthoringTrends.ts`) — moved into the domain
- All raw `supabase.from(...)` calls **inside `src/domains/learning/**`** (hooks, admin components, talent components)
- Updating ~26 external call-site imports to `@/domains/learning`

Out of scope (deferred):
- Raw `supabase.from(...)` in `src/pages/**` (e.g. `ContentNew`, `ModuleManagement`, `QuizManagement`, `Quiz`, `InstructorReviewQueue`, `CourseDetail`, etc.) — these are legacy admin/instructor pages that need a separate UI consolidation pass, not just a repo extraction
- `src/components/player/stages/AssessStage.tsx`, `src/components/AccessCodeDialog.tsx`, `src/components/ai/GlobalAIBubble.tsx`, `src/hooks/useDiscussions.ts`
- Cross-domain consumers (`feed`, `marketing`, `ugc`, `talent`, `analytics`) — handled in their own batches
- Schema/RLS changes, edge contracts, AIChatPanel SSE
- Enabling the `NO_RAW_FROM` ESLint guard (deferred to 10j)

## Inventory (verified)

**23 pure shims to delete** in `src/hooks/`:
useCertificate, useCohorts, useCourseBriefs, useCourseProgress, useEnrollment, useInstructorWorkspace, useItemAnalytics, useItemRewrite, useItemTranslate, useLearningHubDashboard, useLearningStats, useLearningTracks, useMasterySummary, useModuleResources, useModuleReviewBadge, useNextActions, useOrgLearning, useProgress, useResourceProgress, useReviewQueue, useSkillCredentials, useStageProgress, useTutorMasteryContext.

**1 real hook to move** into `src/domains/learning/hooks/`:
- `useAuthoringTrends.ts` (wraps RPC `get_authoring_trends` — no `from()`, just relocate + barrel-export).

**44 raw `supabase.from(...)` call sites inside `src/domains/learning/**`** to migrate into `learningRepo.ts`. Tables touched:

| Area | Files | Tables |
|---|---|---|
| Domain hooks | useStageProgress, useProgress | `enrollment_stage_progress` |
| Domain hooks | useOrgLearning | `company_credits` (read-only single row) |
| Domain hooks | useLearningTracks | `learning_tracks`, `learning_track_items` |
| Domain hooks | useCohorts | `course_sessions`, `cohorts` |
| Domain hooks | useCertificate | `certificates` |
| Talent UI | TracksTab | `academies`, `schools`, `school_readiness_v` |
| Admin sessions | CourseSessionsManager | `course_sessions`, `instructors` |
| Admin progress | LearningProgressTab | `enrollments` (filtered query) |
| Admin moderation | LearningModerationTab | `content_reports`, dynamic `feed_posts`/`post_comments`/`course_discussions` |
| Admin importers | CourseJSONImporter, BulkResourceUpload | `module_resources` |
| Admin content | ContentReadinessChecklist | `content` (publish toggle) |
| Admin graph | useLearningGraph | `content`, `enrollments`, `cohorts`, `course_briefs`, `course_engagements`, `course_sessions`, `certificates`, `instructor_payout_requests` (+ generic upsert/delete) |
| Admin filters | ContentFilters | `profession_categories`, `profession_levels` |
| Admin batch | BatchContentGenerator | `schools`, `profession_categories`, `quiz_questions`, dynamic table update |

## Plan

1. **Create `src/domains/learning/repo/learningRepo.ts`** with named async helpers, grouped by sub-area:
   - **Progress**: `upsertEnrollmentStageProgress(input)` (shared by `useProgress` + `useStageProgress`)
   - **Tracks**: `updateLearningTrack(id, patch)`, `deleteLearningTrackItem(id)`
   - **Cohorts/Sessions**: `upsertCohort(input)`, `upsertCourseSession(input)`, `deleteCourseSession(id)`, `updateCourseSessionStatus(id, status)`, `bulkInsertCourseSessions(rows)`, `listCourseSessionsByContent(contentId)`, `listInstructorsLite()`
   - **Certificates**: `getCertificateByEnrollment(enrollmentId)`
   - **Org learning**: `getCompanyCreditBalances(companyId)`
   - **Talent tracks**: `listAcademiesAndSchools()` (parallel reads + readiness view)
   - **Moderation**: `listContentReports(limit=100)`, `resolveContentReport(id, status)`, `hideModerationTarget(table, scopeId)`
   - **Importers**: `insertModuleResources(rows)`
   - **Content publish**: `setContentPublished(id, published)`
   - **Filters**: `listProfessionCategoriesAndLevels()`
   - **Batch**: `listSchoolsLite()`, `listProgramsBySchool(schoolId)`, `listQuizQuestionsByModuleIds(ids)`, `updateContentDraftPayload(table, id, payload)`
   - **Admin graph**: `getLearningGraphSlice()` (parallel reads of 8 tables), `upsertLearningGraphRow(table, payload)`, `deleteLearningGraphRow(table, id)`, with a `LearningGraphTable` union
   - **Progress filtering**: `listEnrollmentsFiltered(filters)` for `LearningProgressTab`

   Conventions match `jobsRepo.ts` / `gigsRepo.ts`: named exports, throw on error, no React.

2. **Move `useAuthoringTrends.ts`** from `src/hooks/` → `src/domains/learning/hooks/useAuthoringTrends.ts` (no logic change, RPC-only). Add to `src/domains/learning/index.ts` barrel.

3. **Refactor 13 in-domain files** to import from `learningRepo` instead of `@/integrations/supabase/client`:
   - 5 hooks: `useStageProgress`, `useProgress`, `useOrgLearning`, `useLearningTracks`, `useCohorts`, `useCertificate`
   - 7 admin components: `LearningProgressTab`, `LearningModerationTab`, `CourseJSONImporter`, `BulkResourceUpload`, `ContentReadinessChecklist`, `CourseSessionsManager`, `BatchContentGenerator`, `ContentFilters`, `useLearningGraph`
   - 1 talent component: `TracksTab`

4. **Delete 24 shim files** from `src/hooks/`:
   - The 23 listed re-exports
   - The relocated `useAuthoringTrends.ts`

5. **Update ~26 external call sites** to import from `@/domains/learning` (barrel) instead of `@/hooks/useXxx`. Done with a single `rg`-driven sed pass per hook name.

6. **Update `src/domains/learning/index.ts`** to export `useAuthoringTrends` plus the existing surface. Repo is *not* exported via the barrel (internal-only, matches jobs/gigs convention).

## Verification

- `rg "@/hooks/(useCertificate|useCohorts|useCourseBriefs|useCourseProgress|useEnrollment|useInstructorWorkspace|useItemAnalytics|useItemRewrite|useItemTranslate|useLearningHubDashboard|useLearningStats|useLearningTracks|useMasterySummary|useModuleResources|useModuleReviewBadge|useNextActions|useOrgLearning|useProgress|useResourceProgress|useReviewQueue|useSkillCredentials|useStageProgress|useTutorMasteryContext|useAuthoringTrends)"` → empty
- `rg "supabase\\.from\\(" src/domains/learning/` → only `learningRepo.ts`
- `tsc --noEmit` clean
- Smoke: `/app/learning`, `/app/courses/:id`, `/app/cohorts/:id`, `/app/instructor`, `/app/instructor/insights`, admin Learning tabs (Graph, Sessions, Moderation, Progress, Course Briefs)

## Risks & callouts

- `useLearningGraph` has 8 parallel reads + generic upsert/delete across 8 tables — same shape as the gigs-graph helper we just shipped; reuse the union-typed approach.
- `LearningModerationTab` dynamically writes to `feed_posts | post_comments | course_discussions` based on report scope — keep the `table: string` parameter and document the allowlist inside the repo.
- `BatchContentGenerator` writes to dynamic `table` for draft saves — same pattern; pass through with a narrow union.
- `useOrgLearning` and `TracksTab` reference tables that arguably live in other domains (`company_credits`, `academies`, `schools`). Pragmatic call: include them in `learningRepo` because the only callers are learning UI; revisit if a future companies/talent batch needs them.

## Next batch after this

10d — talent (`useTalent`, `useTalentLists`, `useTalentMirror`, `useTalentOutcomeSignal`, `useTalentPitches`, `useTalentRelationships`, `useTalentSearch`, `useSkillCredentials` admin views).

---

## Phase 10c.1 — COMPLETE (hooks-only)

- Created `src/domains/learning/repo/learningRepo.ts` with: `getStageProgress`, `upsertEnrollmentStageProgress`, `updateEnrollmentProgress`, `getEnrollmentProgressBundle`, `getCertificateByEnrollment`, `getCompanyWallet`, `updateLearningTrack`, `listLearningTrackItems`, `insertLearningTrackItem`, `deleteLearningTrackItem`, `upsertCohort`, `upsertCourseSession`.
- Moved `useAuthoringTrends.ts` → `src/domains/learning/hooks/`; added to barrel.
- Refactored 6 hooks to use the repo: `useStageProgress`, `useProgress`, `useOrgLearning`, `useLearningTracks`, `useCohorts`, `useCertificate`. Realtime channels stay inline.
- Deleted 23 shim files in `src/hooks/`.
- Sed-rewrote ~26 external import sites from `@/hooks/use*` → `@/domains/learning`.
- Verified: zero `supabase.from(...)` inside `src/domains/learning/hooks/`; zero `@/hooks/use<learning>` imports anywhere.

## Phase 10c.2 — DEFERRED (admin/talent components)

Next turn will route the 9 remaining in-domain `supabase.from(...)` call sites through `learningRepo`:
`TracksTab.tsx`, `CourseSessionsManager.tsx`, `LearningProgressTab.tsx`, `LearningModerationTab.tsx`, `CourseJSONImporter.tsx`, `BulkResourceUpload.tsx`, `ContentReadinessChecklist.tsx`, `useLearningGraph.ts`, `BatchContentGenerator.tsx`, `ContentFilters.tsx`.
