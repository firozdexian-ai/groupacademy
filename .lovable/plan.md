# Sub-phase 2.3 — Adaptive Learning

Goal: when a learner takes a quiz or scenario, what they see is shaped by *their own* recent performance and the topic-tags they've struggled with — not random sampling. The pools (`module_quiz_pool`, `module_scenario_pool`) and attempt logs (`talent_quiz_attempt`, `talent_scenario_run`) already exist; this sub-phase adds the skill model + adaptive sampler on top.

---

## 2.3 mini sub-phases

| # | Sub-phase | Outcome |
|---|---|---|
| 2.3.a | Skill profile schema | `talent_skill_profile` per (talent, module, topic_tag) → mastery 0–1, attempts, last_seen |
| 2.3.b | Skill update trigger | After every `talent_quiz_attempt` insert → recompute mastery for each topic_tag of served items |
| 2.3.c | Adaptive sampler edge fn | Replace random pool draws with: weakness-weighted topics × difficulty band tuned to current mastery |
| 2.3.d | Wire into quiz/scenario UI | `AssessStage` + `PracticeStage` call new `learner-quiz-adaptive` / `learner-scenario-adaptive` endpoints |
| 2.3.e | Mastery surface | Tiny "skill bars" on stage 6 (ProgressStage) showing per-topic mastery for the just-finished module |

---

## Detailed plan

### 2.3.a — `talent_skill_profile`

```sql
create table public.talent_skill_profile (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  topic_tag text not null,
  mastery numeric(3,2) not null default 0.50,   -- 0.00–1.00, EWMA
  attempts int not null default 0,
  correct int not null default 0,
  last_seen_at timestamptz not null default now(),
  unique (talent_id, module_id, topic_tag)
);
```
RLS: learner reads own; admin reads all; trigger-only writes.

### 2.3.b — Update trigger

`fn_update_skill_profile()` AFTER INSERT on `talent_quiz_attempt`:
- For each `item_id` in `NEW.item_ids`, fetch `topic_tags` + correctness from `NEW.answers`.
- For each topic_tag: EWMA mastery update
  - `new_mastery = round((0.7 * old + 0.3 * was_correct), 2)`
  - bump `attempts` + `correct`, set `last_seen_at = now()`.
- Upsert per (talent, module, topic_tag).

Same shape as a future `fn_update_skill_profile_from_scenario` on `talent_scenario_run` (using `evaluation.score_per_topic`), wired only when scenario evaluation lands; out-of-scope nit for 2.3.

### 2.3.c — Adaptive sampler

New edge function `learner-adaptive-sample` (replaces split between `learner-quiz-pool` and `learner-scenario-pool`, or wraps them):
- Input: `{ moduleId, kind: 'quiz'|'scenario', count }`.
- Verify auth (`auth.getUser`), resolve `talentId`.
- Read `talent_skill_profile` for module → identify weak topics (mastery < 0.6) and unseen topics.
- Pick a difficulty band:
  - avg mastery < 0.4 → easy (60%) / medium (30%) / hard (10%)
  - 0.4–0.7 → easy 25 / medium 55 / hard 20
  - > 0.7 → easy 10 / medium 40 / hard 50
- Query the appropriate pool with: `WHERE module_id=$1 AND difficulty=ANY($band) ORDER BY (topic_tags && weakTags) DESC, times_served ASC, random()`.
- Return items + a small `{ targetedTopics, difficultyBand, mastery }` object so the UI can show why.

Cost guard: still bounded by the pool — no AI generation during draw. If pool empty (< count), fall back to existing `learner-quiz-pool` / `learner-scenario-pool` (which generate on-demand).

### 2.3.d — UI wiring

- `AssessStage.tsx`: swap fetch → `supabase.functions.invoke('learner-adaptive-sample', { body: { moduleId, kind: 'quiz', count: passThreshold>0 ? 10 : 5 }})`.
- `PracticeStage.tsx`: same with `kind: 'scenario'`, `count: 1`.
- Pass `attempt_no` (auto-increment from `talent_quiz_attempt` count) when persisting attempts so we don't break existing analytics.

### 2.3.e — Mastery skill-bars

`ProgressStage` (stage 6) gains a small section: top 5 topic_tags for that module with horizontal bars (`bg-emerald-500` mastery, muted track), labeled with mastery %.
Single query: `select topic_tag, mastery from talent_skill_profile where talent_id=:t and module_id=:m order by mastery asc limit 5`.

---

## Files

**Migration**
- `talent_skill_profile` table + RLS + indexes
- `fn_update_skill_profile` + trigger on `talent_quiz_attempt`

**New**
- `supabase/functions/learner-adaptive-sample/index.ts`
- `src/components/player/stages/MasteryBars.tsx`

**Edited**
- `src/components/player/stages/AssessStage.tsx` — call adaptive sampler
- `src/components/player/stages/PracticeStage.tsx` — call adaptive sampler (scenario)
- `src/components/player/stages/ProgressStage.tsx` — render `<MasteryBars />`

---

## Out of scope (next sub-phases)
- Spaced repetition / due-date scheduling (would extend `talent_skill_profile` with `next_due_at`)
- Adaptive difficulty for non-quiz stages (Learn/Discuss)
- Cross-course skill rollups (per profession_line) → covered by 2.8 Talent Mirror

---

Reply **continue with 2.3.a** to start with the schema, or **continue 2.3 a–c** to ship schema + trigger + edge function in one batch (recommended).
