# Phase 10c.2 — Learning Domain: Admin + Talent Component Repo Migration

Finishes Phase 10c. Routes the remaining 33 raw `supabase.from(...)` calls inside `src/domains/learning/**` (10 components/hooks) through `learningRepo.ts`, so the only file in the domain that touches `supabase.from(...)` is the repo itself.

## Scope

In:
- 1 talent component: `TracksTab.tsx`
- 9 admin files: `CourseSessionsManager.tsx`, `LearningProgressTab.tsx`, `LearningModerationTab.tsx`, `CourseJSONImporter.tsx`, `BulkResourceUpload.tsx`, `ContentReadinessChecklist.tsx`, `useLearningGraph.ts`, `BatchContentGenerator.tsx`, `ContentFilters.tsx`
- Extend `learningRepo.ts` with the missing helpers

Out of scope (deferred):
- Raw `supabase.from(...)` in `src/pages/**` legacy admin/instructor pages (ContentNew/Edit, ModuleManagement, QuizManagement, Quiz, InstructorReviewQueue, CourseDetail, etc.) — covered by a later UI-consolidation pass
- `src/components/player/stages/AssessStage.tsx`, `GlobalAIBubble.tsx`, `AccessCodeDialog.tsx`, `useDiscussions.ts`
- Schema/RLS changes, edge contracts, ESLint `NO_RAW_FROM` enforcement (10j)

## Repo additions (`src/domains/learning/repo/learningRepo.ts`)

| Group | Functions |
|---|---|
| Sessions admin | `listCourseSessionsByContent(contentId)`, `listInstructorsLite()`, `deleteCourseSession(id)`, `updateCourseSessionStatus(id, status)`, `bulkInsertCourseSessions(rows)` |
| Progress admin | `listEnrollmentsFiltered(filters)` (status, content_id, talent_id, range) |
| Moderation | `listContentReports(limit=100)`, `resolveContentReport(id, status)`, `hideModerationTarget(table, scopeId)` — `table` constrained to `"discussion_posts" \| "discussion_threads" \| "lesson_questions" \| "lesson_answers"` |
| JSON importer | `insertContent(payload)`, `insertCourseModule(payload)`, `insertModuleResources(rows)` |
| Bulk uploader | `insertModuleResources(rows)` (shared) |
| Readiness | `setContentPublished(id, published)` |
| Talent tracks | `listAcademiesSchoolsReadiness()` — parallel `academies`, `schools`, `school_readiness_v` |
| Filters | `listProfessionCategoriesAndLevels()` |
| Batch generator | `listSchoolsLite()`, `listProgramsBySchool(schoolId)`, `listQuizQuestionsByModuleIds(ids)`, `updateContentDraftPayload(table, id, payload)` with `ContentDraftTable` union |
| Admin graph | `getLearningGraphSlice()` (8 parallel reads), `upsertLearningGraphRow(table, payload)`, `deleteLearningGraphRow(table, id)` with `LearningGraphTable` union (`content`, `enrollments`, `cohorts`, `course_briefs`, `course_engagements`, `course_sessions`, `certificates`, `instructor_payout_requests`) |

Conventions match Phase 10c.1: named exports, throws on error, no React.

## Refactor pass

Each file imports the relevant helpers and replaces every `supabase.from(...)...` chain with a single function call. No UI/behavior changes.

## Verification

- `rg "supabase\\.from\\(" src/domains/learning/` → only `learningRepo.ts`
- `tsc --noEmit` clean
- Smoke: admin Learn tabs (Graph, Sessions, Moderation, Progress, Course Briefs, Importer, Bulk Upload, Readiness, Batch Generator, Filters) + `/app/learning` Tracks tab

## Risks

- `useLearningGraph` upsert/delete are dynamic-table — keep a narrow `LearningGraphTable` union and `payload: Record<string, unknown>`.
- `LearningModerationTab` `hideModerationTarget` is dynamic on the scope→table map; encode the allowlist inside the repo.
- `BatchContentGenerator.updateContentDraftPayload` writes to dynamic table — narrow via `ContentDraftTable` union.

## Next batch after this

10d — talent (`useTalentSearch`, `useTalentLists`, `useTalentMirror`, `useTalentOutcomeSignal`, `useTalentPitches`, `useTalentRelationships`) + repo extraction in `src/domains/talent/**`.
