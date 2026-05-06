# Phase 2 — Adaptive Learning Engine

## Progress

| Sub-phase | Scope | Status |
|---|---|---|
| 2.1 | Item bank | Done |
| 2.2 | Adaptive sampling | Done |
| 2.3 | Skill profile + EWMA trigger | Done |
| 2.4 | Spaced repetition (a–f) | Done |
| 2.5 | Scenario evaluation → skill signal (a–e) | Done |
| 2.6 | Adaptive learner dashboard widget (a–e) | **Done** |
| 2.7 | Instructor analytics for item bank | Pending |
| 2.8 | Talent Mirror cross-course rollup | Pending |

**Phase 2 completion: ~75%** (6 of 8 sub-phases shipped — engine ingests quiz + scenario signals and is now visible to learners on My Hub and inside the course player).

---

# Sub-phase 2.6 — Adaptive Learner Dashboard Widget

## Goal

Make the adaptive engine *visible* to the learner. Today the EWMA mastery, SM-2 schedule, and scenario evaluations all run silently — the only surfaced signal is the small "X due" pill on Learning Hub. 2.6 adds a single compact widget on the **My Hub** tab (and a per-course variant inside the course player) that shows:

- Average mastery (ring)
- Topics due **now** + the next due-at
- Top 3 weakest topics (with module title + a deep link to review)
- Quiz vs Scenario signal split (last 30 days)
- 7-day activity sparkline (attempts + scenarios per day)

No new write paths — purely read aggregation over `talent_skill_profile`, `talent_quiz_attempt`, and `talent_scenario_run`.

---

## 2.6 mini sub-phases

| # | Sub-phase | Outcome |
|---|---|---|
| 2.6.a | Aggregation edge fn | `learner-mastery-summary` returns totals, weakest topics, signal split, 7d sparkline. Optional `module_id` filter for per-course view. |
| 2.6.b | Hook + card component | `useMasterySummary` + `AdaptiveSnapshotCard` (mobile-compact: ring + chips + sparkline). |
| 2.6.c | My Hub integration | Mount at the top of `MyCoursesTab`, above the active courses list. |
| 2.6.d | Per-course variant | Mount inside the course player stage shell, filtered to that module's content_id. |
| 2.6.e | Empty / cold-start state | Friendly nudge ("Take a quiz or scenario to start tracking mastery") when no `talent_skill_profile` rows exist yet. |

---

## Detailed plan

### 2.6.a — `learner-mastery-summary` edge function

`POST /functions/v1/learner-mastery-summary`

Body (all optional):
- `module_id?: string` — filter to a single module
- `content_id?: string` — filter to a single course
- `days?: number` (default 7, max 30) — sparkline window

Response:
```json
{
  "totals": {
    "tracked_topics": 14,
    "avg_mastery": 0.62,
    "due_now": 3,
    "next_due_at": "2026-05-07T05:00:00Z"
  },
  "weakest": [
    { "module_id": "...", "module_title": "Negotiation Basics", "topic_tag": "anchoring", "mastery": 0.18, "due_at": "..." }
  ],
  "strongest": [ /* same shape, top 3 by mastery */ ],
  "signal_split_30d": { "quiz": 22, "scenario": 5 },
  "sparkline": [
    { "date": "2026-04-30", "quiz": 0, "scenario": 1 },
    { "date": "2026-05-01", "quiz": 4, "scenario": 0 }
  ]
}
```

Implementation:
- Auth via `auth.getUser(token)` → resolve `talent_id` from `talents.user_id`.
- Pull `talent_skill_profile` rows (filtered by module/content).
- Pull `talent_quiz_attempt` and `talent_scenario_run` for the last `days` and group by date.
- Module titles via single batched `course_modules` lookup.

No DB schema changes — read-only.

### 2.6.b — `AdaptiveSnapshotCard`

`src/components/learning/AdaptiveSnapshotCard.tsx`. Mobile-first, single card, vertical layout:

```
+--------------------------------------+
|  [ring 62%]   14 topics tracked      |
|               3 due now • next 5h    |
|--------------------------------------|
|  Weakest                             |
|  • anchoring        18%  ↗ Review    |
|  • active_listening 24%  ↗ Review    |
|--------------------------------------|
|  Activity (7d)   ▁▃▅▂▆▁▃            |
|  22 quizzes · 5 scenarios            |
+--------------------------------------+
```

- Uses brand tokens (`text-primary`, `bg-primary/10`, `Vibrant Cyan` for sparkline).
- `due_now > 0` → primary CTA links to `/app/learning/review`.
- Sparkline drawn with inline SVG (no chart lib) — keeps bundle small.
- Skeleton state while loading; collapsed empty state when `tracked_topics === 0`.

Hook `src/hooks/useMasterySummary.ts` mirrors `useReviewQueue` (invoke + react state, with `moduleId` / `contentId` opts).

### 2.6.c — My Hub integration

In `MyCoursesTab.tsx`, render `<AdaptiveSnapshotCard />` directly above the active courses section (only when the talent has at least one enrollment). Honors the existing 24-grid spacing (`space-y-5`).

### 2.6.d — Per-course variant

Inside the course player shell (where `MasteryBars` already lives), mount `<AdaptiveSnapshotCard contentId={contentId} compact />` so learners see *that course's* mastery snapshot. `compact` mode hides the sparkline and signal split, keeping the card to ~120px tall.

### 2.6.e — Empty state

If `tracked_topics === 0`:
- Show a single-line nudge with an icon: "Complete a quiz or scenario to start tracking your mastery."
- Subtle CTA → opens the My Hub active course or "Browse academy".

---

## Files

**New**
- `supabase/functions/learner-mastery-summary/index.ts`
- `src/hooks/useMasterySummary.ts`
- `src/components/learning/AdaptiveSnapshotCard.tsx`

**Edited**
- `src/components/learning/MyCoursesTab.tsx` — mount card above active list
- `src/components/player/stages/MasteryBars.tsx` (or its parent shell) — mount per-course variant

**No migrations.**

---

## Out of scope (deferred)

- Per-rubric drill-downs (2.7 instructor analytics).
- Cross-course Talent Mirror rollup (2.8).
- Forecasted "next breakthrough" projections.
- Push notifications (already covered by `notify-review-due` from 2.4.f).

---

## Suggested execution order

Reply **continue with 2.6.a** to ship the aggregation edge function first, then **2.6.b–c** as one batch (hook + card + My Hub mount), and **2.6.d–e** to round it off. Or **continue 2.6 a–c** to ship the visible learner-facing slice in one go (recommended).
