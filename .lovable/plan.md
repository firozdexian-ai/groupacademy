# Sub-phase 1.5 — AI Helpers in ContentEdit + Talent-Generated Quiz/Scenario Pool

Two coordinated tracks: (A) admin-side AI helpers inside the catalog editor, (B) a learner-driven quiz & AI-scenario generator backed by a shared, reusable pool to keep AI costs flat as enrollment grows.

---

## Track A — AI helpers inside ContentEdit (unchanged from prior plan)

Single edge function `admin-content-ai` with `mode` discriminator: `description | slug | image_prompt | outline`.

UI surfaces:
- ✨ button next to **Description** → streams a 200+ char marketing description.
- ✨ button next to **Slug** → kebab-case + dedup-checked against `content`.
- **AI Cover** on `ImageUpload` → sheet with 3 prompt variants → image via `gemini-3.1-flash-image-preview` → uploaded to `course-content` bucket → patches `cover_image`.
- **AI Outline** in the empty Modules tab → drafts 5–8 modules (admin edits/reorders).
- **Fix with AI** at top of `ContentReadinessChecklist` → runs the relevant helpers in sequence then re-runs `recompute_content_readiness`.

All AI calls go through the edge function; admin role enforced via `auth.getUser` + `has_role('admin')`. 402/429 surfaced as toasts.

**Files (Track A):**
- New: `supabase/functions/admin-content-ai/index.ts`, `src/lib/contentAI.ts`, `src/components/dashboard/ContentAIActions.tsx`, `src/components/dashboard/AICoverImageSheet.tsx`.
- Edit: `src/pages/ContentEdit.tsx`, `src/components/dashboard/ContentReadinessChecklist.tsx`.

---

## Track B — Talent-generated quiz & AI scenarios with shared pool

### Idea
Instead of admins authoring (or pre-generating) quizzes/scenarios per module, the **learner triggers generation in-flow**. Generated items are saved to a **module-scoped pool** and reused for future learners — so AI cost is amortized across enrollments while each talent still gets a fresh, personalized experience layer on top.

### Pooling model

```text
module ──┬── quiz_pool (shared, reusable items)
         └── scenario_pool (shared, reusable items)
              │
              ▼
   talent_quiz_attempt / talent_scenario_run
   (per-learner selection + personalization seed)
```

When a talent reaches the quiz/scenario step:

1. Look up the module's pool. If pool size ≥ target threshold (e.g. 20 quiz questions / 10 scenarios), **sample** N items deterministically by `(talent_id, module_id, attempt_no)` → no AI call.
2. If pool is below threshold, generate a small batch (5 quiz questions / 1 scenario) via Lovable AI, **insert into the pool**, then sample the talent's set from the now-larger pool.
3. The "personalization layer" is a lightweight wrapper applied at render time — talent's name, role goal, prior wrong-answer topics — without re-generating the underlying item. Keeps cost flat.

This means: first ~4 learners "pay" the AI cost; everyone after draws from the pool.

### New tables (migration)

- `module_quiz_pool` — `id, module_id, question, options jsonb, correct_index, explanation, difficulty, topic_tags text[], generated_by ('ai'|'admin'), created_by_talent_id nullable, quality_score numeric default 0, times_served int default 0, created_at`.
- `module_scenario_pool` — `id, module_id, title, scenario_prompt, rubric jsonb, difficulty, topic_tags text[], generated_by, created_by_talent_id nullable, quality_score, times_served, created_at`.
- `talent_quiz_attempt` — `id, talent_id, module_id, item_ids uuid[], answers jsonb, score, attempt_no, created_at`.
- `talent_scenario_run` — `id, talent_id, module_id, scenario_id, conversation jsonb, evaluation jsonb, created_at`.

RLS:
- Pool tables: `select` open to authenticated talents enrolled in the parent course; `insert` only via SECURITY DEFINER edge function (no direct client writes).
- Attempt/run tables: talent can `select/insert` own rows; admins can read all.

### New edge functions

- `learner-quiz-pool` — modes: `draw` (sample N for this talent, generating only if pool below threshold), `submit` (score + persist attempt + bump `times_served` and `quality_score` based on item discrimination).
- `learner-scenario-pool` — modes: `draw`, `turn` (streams a single conversational turn grounded in `scenario_prompt` + module resources), `evaluate` (rubric scoring at end).

Both functions:
- Verify talent JWT, confirm enrollment in parent course.
- Cap per-talent generation to prevent abuse (e.g. ≤ 2 net-new pool items per module per talent per day).
- Use `google/gemini-3-flash-preview` for generation, with a structured-output tool schema to avoid free-form JSON.

### Frontend (talent side)

- `src/components/learning/ModuleQuizRunner.tsx` — calls `learner-quiz-pool/draw` on entry, renders questions, posts `/submit`, shows score + explanations.
- `src/components/learning/ModuleScenarioRunner.tsx` — chat UI streaming turns from `learner-scenario-pool/turn`, ends with rubric evaluation.
- Hook into existing module stage runner where `resource_type` is `quiz` or `ai_scenario`.

### Admin oversight (lightweight, in 1.5)

- Add a **Pool Inspector** tab inside `ContentEdit` → Modules → per-module drawer showing pool counts, top-served items, and a "hide low-quality" toggle (sets `quality_score = -1` to exclude from sampling). Full curation UI lives in a later phase.

### Cost / performance notes
- First N learners trigger generation; subsequent learners hit the pool → roughly **O(modules)** AI cost, not **O(modules × learners)**.
- `times_served` + `quality_score` (driven by aggregate correct rate / time-to-answer) feed sampling weights — bad items naturally fade.
- Personalization stays cheap: name/goal interpolation is template-side, no extra AI call.

---

## Files (Track B)

### New
- `supabase/functions/learner-quiz-pool/index.ts`
- `supabase/functions/learner-scenario-pool/index.ts`
- `src/components/learning/ModuleQuizRunner.tsx`
- `src/components/learning/ModuleScenarioRunner.tsx`
- `src/lib/learnerAIPool.ts` — shared client wrappers + sampling helpers.

### Edited
- Module stage runner (existing) — route `quiz` / `ai_scenario` resources to the new runners.
- `src/pages/ContentEdit.tsx` — add Pool Inspector drawer in the Modules tab.

### Database (migration)
- 4 new tables + RLS + a SECURITY DEFINER function `pool_draw_or_generate(module_id, kind, n, talent_id)` that the edge functions call.

---

## Out of scope for 1.5
- Per-talent adaptive difficulty progression (next phase).
- Admin bulk pre-seeding of pools (separate tool).
- Cross-module pool sharing.
- Image/audio scenarios.

Reply **continue** to implement (DB migration first, then Track B backend, then Track A helpers, then UI wiring).
