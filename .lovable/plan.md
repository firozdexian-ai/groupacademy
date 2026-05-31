# D3 — Learning Hub (Talent Side) Copy Audit

Following D2 (Work Hub), D3 sweeps the talent-facing **Learning Hub** for jargon, internal feature names, and unclear copy. Copy/labels only — no logic, no data, no visual redesign.

## Scope (talent-facing only)

**Pages**
- `src/pages/app/LearningHub.tsx`
- `src/pages/app/AppMyLearning.tsx`, `AppCourses.tsx`, `AppCourseDetail.tsx`, `AppTrackDetail.tsx`
- `src/pages/app/AppCohortHome.tsx`, `AppCohortDiscussions.tsx`, `AppDiscussionThread.tsx`
- `src/pages/app/AppSessionJoin.tsx`, `AppEvents.tsx`
- `src/pages/app/AppReviewQueue.tsx`, `AppSubmissionDetail.tsx`
- `src/pages/LearningReview.tsx`, `src/pages/VerifySkillCredential.tsx`

**Components — `src/domains/learning/components/talent/`**
- Views: `MyHubView`, `TracksView`, `AcademyView`, `StudyAbroadView`
- Cards/panels: `ActiveCourseHero`, `AdaptiveSnapshotCard`, `CareerTracksPreview`, `NextActionsCard`, `QuickStats`, `QuickActionCard`, `SkillCredentialsPanel`, `TalentMirrorPanel`, `TrackProgressRing`, `LearningStreak`, `ItemBankAnalyticsPanel`
- Runners: `ModuleQuizRunner`, `ModuleScenarioRunner`, `ReviewQueueRunner`
- Lists/rails: `CoursesTab`, `MyCoursesTab`, `TracksTab`, `EventsTab`, `UpcomingSessionsRail`, `UnifiedDiscovery`, `JoinLivePanel`, `WebinarEnrollPanel`, `StudyAbroadSection`

## What to look for (per v0.5 glossary)

1. **Internal jargon** — Telemetry, Ledger, Registry, Vector, Signal, Pipeline, Synthesis, Node, Phase, Cohort (when raw), HUD, Schema, RPC, Tokens, Verdict.
2. **Internal feature names leaking into UI** — "Talent Mirror", "Item Bank", "Adaptive Snapshot", "Next-Best-Action", "Skill Signal", "Authoring Feedback Loop", "Mastery Rollup", raw `last_source`, `needs_review`.
3. **Status / state pills** — raw `awaiting_review`, `in_progress_internal`, `cohort_active`, etc.
4. **Empty states & errors** — "No records", "Query failed", "Edge function returned…" → plain English.
5. **CTA clarity** — "Run review", "Compute mastery", "Trigger rollup" → "Start review", "See progress".
6. **Tooltips & badge labels** — mastery %, credential states, streak labels.
7. **Decorative noise** — "Cognitive Core", "Executive Logic", "Phase 4.x", "[cite: N]", footer protocol strings.

## Keep (intentional domain language)
Mastery, Skill, Credential, Verified, Track, Module, Scenario, Quiz, Cohort (when paired with a name), AI tutor, AI coach, Recommendations.

## Approach

1. `rg -in` sweep across scope for jargon glossary + leaked feature names.
2. Read each file with hits end-to-end; map raw status enums shown to users.
3. Apply small, parallel `line_replace` edits — copy only.
4. Re-run sweep; expect zero hits except code identifiers / comments.

## Out of scope

- Admin learning UI (`components/admin/**`, `dashboard/learning`) — C-series.
- Gro10x learn shell (`src/gro10x/pages/Gro10xLearn.tsx`, `OpsTracksTab`) — separate D-track.
- Instructor workspace pages (`InstructorInsights`, `InstructorReviewQueue`) — D4 candidate.
- Edge functions / RPCs / DB.

## Deliverable

Single batch of edits + summary table: file → before → after.

**Next after D3:** D4 — Instructor & Gro10x learn shells.
