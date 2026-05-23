# B3.1 — Learning Hub Jargon Residue Cleanup

B3 took the heavy pass last round. The latest sweep still flags 11 user-visible strings inside `src/domains/learning/` that slipped through (mix of T1 toasts and T2 labels). This phase closes them out so the Learning Hub is clean before we move on to B4 (Jobs/Gigs/Abroad).

## Scope

Talent-facing Learning surfaces only. No schema, no business logic. Plain string replacements using the project's plain-English voice already established in the prior B3 sweep.

## Files & replacements

### T1 — user-blocking copy

1. `src/domains/learning/hooks/useSkillCredentials.ts` — L117
   - `Cryptographic Ledger Verified: Issued N new skill credentials.` → `Issued N new skill credentials.`

2. `src/domains/learning/components/talent/WebinarEnrollPanel.tsx` — L77
   - `Ecosytem Capacity Maximum: Selected synchronous channel is fully booked.` → `This session is fully booked.`

3. `src/domains/learning/components/talent/ModuleScenarioRunner.tsx`
   - L283 tag fallback `Core Competency Vector` → `Skill`
   - L356 scenario title fallback `Operational Execution Simulation` → `Scenario`
   - L395 role label `Candidate Operator Input` / `System Environment Response` → `You` / `Scenario`

4. `src/domains/learning/components/talent/TalentMirrorPanel.tsx`
   - L157 `Tracked Knowledge Vectors` → `Topics tracked`
   - L158 `Mean Mastery Profile` → `Average mastery`

### T2 — decorative labels

5. `src/domains/learning/hooks/useCohorts.ts` — L110
   - Internal log string: `[Digital Workforce] SIGNAL: Cohort [..] health status marked CRITICAL. Notifying Dean Agent.` → `[learning] Cohort {id} health critical — notifying admin.`

6. `src/domains/learning/components/talent/CoursesTab.tsx` — L499
   - `Settlement Pools Staged` → `Prizes announced soon`

7. `src/domains/learning/components/talent/WebinarEnrollPanel.tsx` — L207
   - Button: `Debit Framework & Lock Pass` / `Acquire Free Entry Pass` → `Enroll for N credits` / `Enroll for free`

8. `src/domains/learning/components/talent/ItemRewriteSheet.tsx` — L468
   - `Editable Buffer Token` / `Malformed JSON Syntax` → `Editable` / `Invalid JSON`

9. `src/domains/learning/components/talent/EventsTab.tsx` — L25
   - Filter chip `Study Abroad Track` → `Study Abroad`

10. `src/domains/learning/components/talent/TracksTab.tsx` — L197
    - Fallback track title `Specialized Core Track` → `Untitled track`

## Verification

- After edits, re-run the jargon sweep and confirm `src/domains/learning/**` shows 0 hits in `.lovable/v0.5-jargon-hits.md`.
- Spot-check Learning Hub, Talent Mirror, Webinar enroll panel, and Scenario Runner in the preview for any visible regression.
- Update `.lovable/plan.md` B3 section: mark B3.1 done, restate next batch (B4 Jobs/Gigs/Abroad ~70 hits).

## Out of scope

- B4 surfaces (Jobs, Gigs, Career Abroad) — handled in the next phase.
- Player/shared components (`src/components/player/**`, `ResearchPromptDialog`, etc.) — those live outside the Learning domain folder and ship with B5.
- Any logic, state, or styling changes.
