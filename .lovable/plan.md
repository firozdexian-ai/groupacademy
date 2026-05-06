# Phase 2 — Adaptive Learning Engine

## Progress

| Sub-phase | Scope | Status |
|---|---|---|
| 2.1 | Item bank | Done |
| 2.2 | Adaptive sampling | Done |
| 2.3 | Skill profile + EWMA trigger | Done |
| 2.4 | Spaced repetition (a–f) | Done |
| 2.5 | Scenario evaluation → skill signal | Done |
| 2.6 | Adaptive learner dashboard widget | Done |
| 2.7 | Instructor analytics for item bank | **Done** |
| 2.8 | Talent Mirror cross-course rollup | Pending |

**Phase 2 completion: ~88%** (7 of 8 sub-phases shipped — admins now see per-item p-values, scenario rubric averages, topic mastery rollups, and "needs review" flags inside Module Manager).

---

# Sub-phase 2.7 — Instructor Analytics for the Item Bank

## Goal

Give admins/instructors a per-module analytics view over the quiz + scenario item banks so they can spot weak items, fix bad questions, and see which topics learners actually struggle with. Today `module_quiz_pool` and `module_scenario_pool` already track `times_served`, `times_correct`, and `quality_score`, but nothing surfaces them. 2.7 turns that raw telemetry into a usable instructor view.

This is **read-only** for the instructor (no editing of items in this slice — that stays in the existing module Resource Manager). Phase 2.8 (Talent Mirror) builds on top of the same aggregation.

---

## 2.7 mini sub-phases

| # | Scope | Outcome |
|---|---|---|
| 2.7.a | Aggregation edge fn | `instructor-item-analytics` returns per-item stats, topic-tag rollups, and per-item difficulty calibration for a module. Admin-gated. |
| 2.7.b | Hook + panel | `useItemAnalytics` + `ItemBankAnalyticsPanel` (table + topic chips + flagged-items list). |
| 2.7.c | Mount in Module Manager | New "Analytics" tab inside `ModuleManagement.tsx` (or its module detail Sheet) alongside the existing quiz/scenario editors. |
| 2.7.d | Flagging signals | Compute and display `needs_review` flags: low p-value, low avg rubric score, near-zero serves after N days, divergent difficulty vs target. |

---

## Detailed plan

### 2.7.a — `instructor-item-analytics` edge function

`POST /functions/v1/instructor-item-analytics`

Body:
- `module_id: string` (required)
- `days?: number` (default 30, max 90) — windows the recent attempt rollup; lifetime stats still come from `times_served` / `times_correct`.

Auth: validate JWT, then require `has_role(uid, 'admin')`. (Course-instructor scoping can be layered later — admins are the only role with edit access today.)

Aggregations:
- **Quiz items** (`module_quiz_pool` joined to `talent_quiz_attempt.item_ids` + `answers`):
  - `serves_lifetime`, `correct_lifetime`, `p_value = correct/serves`
  - `serves_window`, `correct_window`, `p_value_window`
  - `topic_tags`, `difficulty` (target), `quality_score`
  - `needs_review` flags: `p_value < 0.25` or `> 0.95` (broken/trivial), `serves_lifetime < 3 && created_at < now()-14d` (stale), `difficulty='easy' && p_value<0.4` (miscalibrated).
- **Scenario items** (`module_scenario_pool` joined to `talent_scenario_run.evaluation`):
  - `runs_lifetime`, `runs_window`
  - `avg_overall` (from `evaluation->>'overall_score'`), `avg_per_rubric` (rubric criterion → avg)
  - `needs_review`: `avg_overall < 0.3 && runs >= 3`, or zero runs after 14d.
- **Topic-tag rollup** (across both pools): for each tag — items count, avg `p_value`, avg scenario score, learner-mastery mean from `talent_skill_profile` (already grouped by topic_tag).

Response shape:
```json
{
  "module": { "id": "...", "title": "..." },
  "summary": {
    "quiz_items": 24, "scenario_items": 6,
    "avg_p_value": 0.71, "avg_scenario_score": 0.58,
    "items_needing_review": 5
  },
  "quiz_items": [
    { "id": "...", "question": "...", "topic_tags": ["anchoring"], "difficulty": "medium",
      "serves_lifetime": 42, "correct_lifetime": 9, "p_value": 0.21,
      "serves_window": 12, "p_value_window": 0.17, "needs_review": ["low_p_value"] }
  ],
  "scenario_items": [
    { "id": "...", "title": "...", "topic_tags": [...], "runs_lifetime": 8,
      "avg_overall": 0.62, "avg_per_rubric": { "clarity": 0.7, "empathy": 0.55 },
      "needs_review": [] }
  ],
  "topics": [
    { "topic_tag": "anchoring", "items": 6, "avg_p_value": 0.31,
      "avg_scenario_score": 0.4, "learner_mastery_mean": 0.28 }
  ]
}
```

No DB schema changes. Pure aggregation in Deno (small modules — pulling all attempts for a single module in a 90d window is bounded).

### 2.7.b — Hook + panel component

- `src/hooks/useItemAnalytics.ts` — invokes the function, returns `{ data, loading, error, refresh }`.
- `src/components/learning/ItemBankAnalyticsPanel.tsx`:
  - **Header strip**: 4 mini-stats (quiz items, scenario items, avg p-value ring, items needing review).
  - **Topics table**: tag • items count • p-value • scenario score • learner mastery (color-coded against `< 0.4` / `0.4–0.7` / `> 0.7` using brand tokens).
  - **Quiz items table** (sortable by p-value asc by default): question (truncated), topic tag chips, serves, p-value, difficulty, "needs review" badges.
  - **Scenario items table**: title, runs, overall score, per-rubric mini-bars, badges.
  - Mobile: tables collapse into stacked cards (the existing pattern in admin views).

Brand tokens only (`text-primary`, `bg-success-green/10`, `text-destructive`). No charts library — small inline SVG bars.

### 2.7.c — Mount in Module Manager

`src/pages/ModuleManagement.tsx` already has the per-module sheet and links to the resource manager. Add an **Analytics** entry (button / tab) on each module row that opens a Sheet rendering `<ItemBankAnalyticsPanel moduleId={id} />`. Admin-only — gate via existing `has_role` check used elsewhere in the page (or the standard `useAdmin` guard).

### 2.7.d — Flagging signals

Computed inside the edge fn (no new tables); surfaced in 2.7.b as red/amber badges on each row + a "Items needing review" filter chip at the top of the quiz/scenario tables. Codes:
- `low_p_value` (<0.25)
- `trivial` (>0.95)
- `stale` (low serves + old)
- `miscalibrated` (difficulty vs p-value mismatch)
- `low_rubric` (scenario avg < 0.3)

---

## Files

**New**
- `supabase/functions/instructor-item-analytics/index.ts`
- `src/hooks/useItemAnalytics.ts`
- `src/components/learning/ItemBankAnalyticsPanel.tsx`

**Edited**
- `src/pages/ModuleManagement.tsx` — add Analytics sheet trigger per module
- `.lovable/plan.md` — mark 2.7 done, bump Phase 2 to ~88%
- `mem://index.md` + new memory entry for the analytics pipeline

**No migrations.**

---

## Out of scope (deferred)

- Editing items inline from the analytics panel (already lives in Resource Manager).
- Cross-module / cross-course rollups (that's 2.8 Talent Mirror).
- Per-instructor scoping beyond `admin` role (course-owner ACL is a future security pass).
- Exports (CSV) — easy follow-up once the panel is in place.

---

## Suggested execution order

Reply **continue with 2.7** to ship a–d in one batch (recommended — the panel is meaningless without the edge fn and vice versa), or **continue with 2.7.a** to land just the aggregation function first.