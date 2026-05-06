# Sub-phase 2.4 — Spaced Repetition & Review Queue

Goal: turn the new skill profile from a one-shot signal into an ongoing memory engine. After a learner finishes a module, weak topics resurface on a schedule (SM-2-style), and a single "Review" surface lets them clear due items across all modules they've touched. This is the natural follow-up to 2.3: 2.3 made *what gets shown* adaptive; 2.4 makes *when it gets shown again* adaptive.

---

## 2.4 mini sub-phases

| # | Sub-phase | Outcome |
|---|---|---|
| 2.4.a | Schedule schema | Extend `talent_skill_profile` with `interval_days`, `ease`, `due_at`, `last_reviewed_at` |
| 2.4.b | Schedule trigger | After every quiz attempt, recompute SM-2 schedule per topic from EWMA result |
| 2.4.c | Review queue edge fn | `learner-review-queue` returns due topics across all modules + a sampled item per topic |
| 2.4.d | Review page UI | New `/app/learning/review` route with daily-streak header, due count, and inline quiz runner |
| 2.4.e | Notifications + dashboard surfacing | "N topics due today" badge in Learning hub + optional daily reminder via existing notifications table |

---

## Detailed plan

### 2.4.a — Extend `talent_skill_profile`

Migration adds:
```
interval_days     int          not null default 1
ease              numeric(3,2) not null default 2.50
due_at            timestamptz  not null default now()
last_reviewed_at  timestamptz
```
Plus index `(talent_id, due_at)` for the daily queue lookup.

No RLS changes — existing learner-own / admin-read policies cover the new columns.

### 2.4.b — Schedule trigger

Extend `fn_update_skill_mastery_from_attempt` (created in 2.3.b). After the EWMA upsert, recompute SM-2 per touched topic:

```text
quality = round(mastery * 5)            -- 0..5
if quality < 3:
   interval_days = 1
   ease = max(1.30, ease - 0.20)
else:
   if attempts == 1: interval_days = 1
   elif attempts == 2: interval_days = 6
   else:              interval_days = round(interval_days * ease)
   ease = ease + (0.10 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
   ease = greatest(1.30, ease)
due_at = now() + interval_days * '1 day'
last_reviewed_at = now()
```

All inside the same trigger to keep the chain atomic.

### 2.4.c — `learner-review-queue` edge function

- Verifies JWT (`auth.getUser`).
- Body: `{ limit?: number, module_id?: string }`.
- Returns:
  - `due_topics`: `talent_skill_profile` rows where `talent_id = user.id` and `due_at <= now()`, ordered by `due_at` then ascending mastery, capped at `limit` (default 20).
  - For each due topic, one sampled `module_quiz_pool` item matching `module_id` and `topic_tags && [topic_tag]`, weighted toward unseen / lower `times_served`.
  - `summary`: `{ total_due, modules_touched, oldest_due_at }`.

Reuses the same scoring helpers as `learner-adaptive-sample` for consistency.

### 2.4.d — Review surface

New route `/app/learning/review` (lazy-loaded), linked from the Learning hub. Page sections:

```text
+---------------------------------------+
| [Streak: 3🔥]   12 topics due today   |
+---------------------------------------+
| Mastery snapshot (mini bars, top 5)   |
+---------------------------------------+
| Inline quiz runner over the queue     |
|  - one item per due topic             |
|  - submit -> writes talent_quiz_attempt
|  - trigger reschedules in DB          |
+---------------------------------------+
| "Done for today" empty state          |
+---------------------------------------+
```

Reuses `ModuleQuizRunner`-style components but switches the source to the review queue. Submitting an attempt naturally reuses 2.3's trigger chain — no separate write path.

### 2.4.e — Surfacing

- Learning hub tab badge: small `Badge` next to "Academy" showing due count, fetched via the same edge fn with `limit: 1` + `summary` only.
- Optional daily nudge: insert a `notifications` row of type `review_due` once per day if `total_due > 0`. Implemented as a tiny edge fn `notify-review-due` triggered by an existing scheduled run (or on app-open if scheduling isn't wired yet — pick the cheaper path).

---

## Files

**Migration**
- ALTER `talent_skill_profile` (4 cols + index)
- Replace `fn_update_skill_mastery_from_attempt` with the SM-2 extension

**New**
- `supabase/functions/learner-review-queue/index.ts`
- `supabase/functions/notify-review-due/index.ts` (only if we go with scheduled nudges)
- `src/pages/LearningReview.tsx`
- `src/components/learning/ReviewQueueRunner.tsx`
- `src/hooks/useReviewQueue.ts`

**Edited**
- `src/App.tsx` (route)
- Learning hub page (badge + entry card)

---

## Out of scope

- Cross-course rollups into a profession-line skill graph (that's 2.8 Talent Mirror).
- Scenario-based scheduling (depends on `talent_scenario_run.evaluation` being structured; revisit after 2.5).
- Email digests for due reviews (sits behind notifications-only for now).

---

Reply **continue with 2.4.a** to start with the schema + trigger, or **continue 2.4 a–c** to ship schema, trigger, and the review queue edge function in one batch (recommended).
