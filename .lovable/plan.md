# Phase 2 — Adaptive Learning Engine

## Progress so far

| Sub-phase | Scope | Status |
|---|---|---|
| 2.1 | Item bank (`module_quiz_pool`, `module_scenario_pool`) | Done |
| 2.2 | Adaptive sampling edge fn (`learner-adaptive-sample`) | Done |
| 2.3 | Skill profile + EWMA mastery trigger | Done |
| 2.4 | Spaced repetition (SM-2 schedule, review queue, hub badge, daily nudge) | Done (a–f) |
| 2.5 | Scenario evaluation → skill signal | Done (a–e) |
| 2.6 | Adaptive learner dashboard widget | Pending |
| 2.7 | Instructor analytics for item bank | Pending |
| 2.8 | Talent Mirror cross-course rollup | Pending |

**Phase 2 completion: ~62%** (5 of 8 sub-phases shipped — adaptive engine now ingests both quiz and scenario signals through a single SM-2 review queue; remaining work is surfacing dashboards + instructor analytics + cross-course rollup).

---

# Sub-phase 2.5 — Scenario Evaluation as Skill Signal

Goal: extend the adaptive engine beyond multiple-choice. Today only quiz attempts feed `talent_skill_profile`. Scenario runs (open-ended chat against a scenario prompt) already exist in `talent_scenario_run` but their `evaluation` JSON is unstructured, so the EWMA + SM-2 chain ignores them. 2.5 makes scenario evaluations structured, scored per topic, and merged into the same skill profile the review queue reads from.

---

## 2.5 mini sub-phases

| # | Sub-phase | Outcome |
|---|---|---|
| 2.5.a | Evaluator schema | Define a fixed JSON shape for `talent_scenario_run.evaluation` (per-topic scores 0..1 + rubric notes) |
| 2.5.b | AI evaluator edge fn | `learner-scenario-evaluate` calls Lovable AI to score a finished `conversation` against the scenario rubric and writes back `evaluation` |
| 2.5.c | Skill profile trigger | Mirror the quiz-attempt trigger: on `talent_scenario_run.evaluation` update, fold per-topic scores into `talent_skill_profile` (EWMA + SM-2 reschedule) |
| 2.5.d | Runner integration | Update existing `ModuleScenarioRunner` to call the evaluator on completion and show topic-level feedback inline |
| 2.5.e | Review-queue inclusion | Allow scenario topics to appear in `learner-review-queue`, with a `source: "quiz" \| "scenario"` discriminator so the UI can show the right prompt |

---

## Detailed plan

### 2.5.a — Evaluation JSON shape

`talent_scenario_run.evaluation` standardised to:

```json
{
  "version": 1,
  "overall": 0.72,
  "topics": [
    { "tag": "negotiation_anchoring", "score": 0.8, "weight": 1.0, "notes": "Opened with a strong anchor." },
    { "tag": "active_listening",     "score": 0.5, "weight": 1.0, "notes": "Missed two empathy cues." }
  ],
  "rubric_id": "default_v1",
  "evaluated_at": "..."
}
```

Validation enforced in the edge function (zod) and a permissive CHECK that only requires `version` + `topics[]` to keep historical rows compatible.

### 2.5.b — `learner-scenario-evaluate` edge function

- Verifies JWT, loads the run, rejects if `evaluation` already set unless `force=true`.
- Loads scenario rubric: `module_scenario_pool.topic_tags` + `module_scenario_pool.rubric` (existing column if present, else fall back to a generic rubric).
- Calls Lovable AI (`google/gemini-2.5-flash`) with a fixed system prompt that returns the JSON shape above. Uses tool-call / JSON mode, parses, validates, retries once on parse error.
- Writes `evaluation`, returns it to the client.

Cost-controlled: only one call per finished run; client cannot re-trigger without `force` (admin-only).

### 2.5.c — Skill profile trigger

New trigger `trg_update_skill_mastery_from_scenario` on `talent_scenario_run` (AFTER UPDATE OF evaluation). Function `fn_update_skill_mastery_from_scenario`:

- For each `topics[]` entry, compute the same EWMA update as the quiz path, weighted by `weight`.
- Run the same SM-2 reschedule (`interval_days`, `ease`, `due_at`).
- Increment `attempts`, set `last_reviewed_at = now()`.

Both trigger paths share a SECURITY DEFINER helper `fn_apply_topic_signal(talent_id, module_id, content_id, topic_tag, score, source)` so quiz + scenario stay in lock-step.

### 2.5.d — Runner integration

`ModuleScenarioRunner.tsx`:

- On scenario "Finish" press → POST to `learner-scenario-evaluate`.
- Render a small `EvaluationSummary` card: overall ring + per-topic bars + rubric notes.
- If the run already has an `evaluation`, skip the call and render directly.

### 2.5.e — Review-queue inclusion

- Extend `learner-review-queue` to also pull due rows whose last signal came from a scenario, exposed via a new `talent_skill_profile.last_source text` column (`'quiz' | 'scenario'`).
- Response items get `source` so the Review UI can branch:
  - `quiz` → existing inline question
  - `scenario` → "Replay scenario" link to the scenario runner (re-run uses the existing module scenario pool).

No schema change to the queue payload beyond the new field.

---

## Files

**Migration**
- ALTER `talent_skill_profile` ADD `last_source text DEFAULT 'quiz'`
- CREATE `fn_apply_topic_signal` (extracted helper)
- Refactor `fn_update_skill_mastery_from_attempt` to call the helper
- CREATE `fn_update_skill_mastery_from_scenario` + trigger
- Optional permissive CHECK on `talent_scenario_run.evaluation`

**New**
- `supabase/functions/learner-scenario-evaluate/index.ts`
- `src/components/learning/EvaluationSummary.tsx`

**Edited**
- `src/components/learning/ModuleScenarioRunner.tsx`
- `src/components/learning/ReviewQueueRunner.tsx` (branch on `source`)
- `supabase/functions/learner-review-queue/index.ts` (return `source`, include scenario-sourced rows)

---

## Out of scope

- Multi-rater evaluator ensembling (single-pass Gemini 2.5 Flash is enough for v1).
- Voice / video scenario inputs.
- Per-rubric custom weights in the UI (admin-only via SQL until 2.7 instructor analytics).

---

Reply **continue with 2.5.a** to start with the schema + helper trigger refactor, or **continue 2.5 a–c** to ship schema, evaluator, and trigger in one batch (recommended).