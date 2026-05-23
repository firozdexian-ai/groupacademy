# Phase B3 — Learning Hub Jargon Cleanup

Continue the v0.5 sweep on the Learning surface. Target ~60 hits flagged in `.lovable/v0.5-jargon-hits.md`. Strictly follow `.lovable/v0.5-jargon-glossary.md`.

## Scope (talent learning surface only)

Files in priority order, based on user visibility + known offenders:

1. **`src/pages/app/LearningHub.tsx`** — "Academic Hub" header → "Learning"; tab label "Career Path" review.
2. **`src/pages/app/TalentMirror.tsx`** — heavy offender: "Logic Node Fault", "Telemetry sync error", "Digital Workforce Anomaly Protocol", "Protocol: Verified Mastery Sync v2.6.4", "Executive Logic geometry".
3. **`src/domains/learning/components/talent/ModuleQuizRunner.tsx`** + `ModuleScenarioRunner.tsx` — quiz/scenario flow toasts and error states.
4. **`src/domains/learning/components/talent/ReviewQueueRunner.tsx`** — review session copy.
5. **`src/domains/learning/components/talent/TalentMirrorPanel.tsx`** + `SkillCredentialsPanel.tsx` — section titles, empty states.
6. **`src/domains/learning/components/talent/views/`** (MyHubView, TracksView, AcademyView, StudyAbroadView) — headings, empty states, error toasts.
7. **`src/domains/learning/components/talent/`** remaining: `NextActionsCard`, `AdaptiveSnapshotCard`, `ActiveCourseHero`, `QuickStats`, `LearningStreak`, `ItemBankAnalyticsPanel`, `ItemRewriteSheet`, `JoinLivePanel`, `WebinarEnrollPanel`, `UpcomingSessionsRail`, `CareerTracksPreview`, `UnifiedDiscovery`, `TrackProgressRing`, `CoursesTab`, `MyCoursesTab`, `TracksTab`, `EventsTab`.
8. **`src/pages/LearningReview.tsx`** — standalone review page.

## Replacement rules (from glossary)

- "Logic Node Fault" / "TalentMirrorNodeFailure" → "Something went wrong"
- "Telemetry sync error" → "Couldn't sync your progress"
- "Digital Workforce Anomaly Protocol" → plain `console.error` + admin notify, no user copy
- "Academic Hub" → "Learning"
- "Synthesis Pipeline" / "Protocol vN.N.N" footer badges → remove
- "Mastery visualization across all academic programs." → "Your skills and progress across all courses."
- "Executive Logic geometry" comments → drop comment or replace with plain description
- `[cite: N]` markers → remove from user-visible strings (already permitted in code comments per scope)

## Out of scope

- Admin/Gro10x learning surfaces
- Code identifiers, telemetry event names, comments not in JSX text
- T2 decorative-only hits unless trivially adjacent to a T1 fix
- Behavior, data, or routing changes

## Workflow

1. Edit files in the order above, batching parallel writes per file.
2. After all edits, run `bunx tsx scripts/jargon-sweep.ts` to refresh `.lovable/v0.5-jargon-hits.md`.
3. Update `.lovable/plan.md` with new counts and mark B3 done.
4. Report remaining T1/T2 totals and propose B4 (Jobs + Gigs + Career Abroad).

## Estimated impact

- ~60 hits removed (target: T1 from 81 → ~35, T2 from 167 → ~140)
- ~2.5 hrs in build mode
- Defensible stop point before B4 if priorities shift

## Stop point if B3 alone is approved

After B3 ships and counts are reported, await go for B4 instead of auto-continuing.
