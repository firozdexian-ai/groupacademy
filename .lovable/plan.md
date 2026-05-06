# Phase 2 ✅ + Phase 3 — In Flight

## Phase 2 — Adaptive Learning Engine — **100% shipped**

| # | Sub-phase | Outcome |
|---|---|---|
| 2.1 | Item bank | `module_quiz_pool` + `module_scenario_pool` |
| 2.2 | Adaptive sampling | `learner-quiz-pool` + `learner-scenario-pool` |
| 2.3 | Skill profile + EWMA | `talent_skill_profile` |
| 2.4 | Spaced repetition | SM-2 + review queue + `notify-review-due` |
| 2.5 | Scenario → skill signal | `learner-scenario-evaluate` (Gemini) → `last_source='scenario'` |
| 2.6 | Adaptive learner widget | `AdaptiveSnapshotCard` |
| 2.7 | Instructor analytics | `instructor-item-analytics` + `ItemBankAnalyticsPanel` |
| 2.8 | Talent Mirror | `learner-talent-mirror` + `/app/talent-mirror` |

---

## Phase 3 — Activate the Engine

| # | Sub-phase | Status |
|---|---|---|
| 3.1 | Next-Best-Action recommender | **Done (a–c)** |
| 3.2 | Verifiable Skill Credentials | Pending |
| 3.3 | Talent Mirror → Public Profile | Pending |
| 3.4 | Mastery-driven Job Match | Pending |
| 3.5 | AI Tutor with mastery context | Pending |
| 3.6 | Authoring feedback loop | Pending |
| 3.7 | Cohort & peer benchmarks | Pending |
| 3.8 | Mastery snapshots & trend lines | Pending |

**Phase 3 completion: ~12%** (1 of 8 sub-phases)

### Recommended order
3.1 → 3.6 → 3.5 → 3.2 → 3.3 → 3.4 → 3.8 → 3.7

---

## 3.1 ship notes

- Edge fn `learner-next-actions` — JWT-required; aggregates `talent_skill_profile` + `enrollments` + `module_scenario_pool`. Returns up to 5 actions (`review_due`, `practice_weakness`, `finish_module`, `take_scenario`) with scores, reasons, and CTA routes.
- `useNextActions` hook + `<NextActionsCard>` component (mobile-first row stack, brand-token tones per action type, lucide icons).
- Mounted above `<AdaptiveSnapshotCard>` on the My Hub tab.
- No DB changes.

3.1.d (cold-start nudge) deferred — current My Hub already handles the zero-enrollment empty state above the card stack, and `<NextActionsCard>` returns null when there are no actions.

---

## Up next: 3.6 Authoring Feedback Loop (planned)

Daily admin digest + inline Module Manager nudges of items flagged by 2.7's `needs_review` codes — closing the loop from analytics → fix → re-test. Reply **continue with 3.6** to move forward.
