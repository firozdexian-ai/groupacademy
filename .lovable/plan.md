# Sub-phase 3.8 — Multilingual Rewrite Support & Cross-Course Authoring Insights

3.7 made single-item AI fixes one click. 3.8 finishes Phase 3 by (a) letting authors generate **localized** versions of an item in any target language without losing the original, and (b) giving instructors and admins a **portfolio-level view** of where their content quality is trending — across every course they own, not just one module.

This closes the loop: 3.6 surfaces flags → 3.7 fixes the item → 3.8 translates the fix and shows trends so authors know whether their fixes are actually working over time.

---

## Part A — Multilingual Rewrites (item-level translation)

### Data model
New sidecar table `module_item_translations` (does not mutate quiz/scenario pools — preserves analytics on canonical English items):

```
module_item_translations
  id uuid pk
  item_id uuid not null
  item_type text check in ('quiz','scenario')
  language_code text  -- 'bn', 'es', 'fr', 'ar', 'hi', etc. (ISO 639-1)
  payload jsonb       -- {question, options[], explanation} or {prompt, rubric[]}
  source 'ai' | 'human'
  reviewed_by uuid null
  reviewed_at timestamptz null
  created_at timestamptz default now()
  unique (item_id, item_type, language_code)
```

RLS: Admins manage; enrolled users can SELECT translations for items in modules they're enrolled in (mirrors pool policy).

### Edge function `ai-item-translate`
- Admin-gated (`has_role admin` check via auth header).
- Input: `{ item_id, item_type, target_language }`.
- Loads canonical item from `module_quiz_pool` / `module_scenario_pool`.
- Calls Lovable AI (`google/gemini-3-flash-preview`) with structured tool-calling — same shape as 3.7 but constrained to translation: preserve correct_index, preserve rubric weights, only translate prose.
- Returns suggestion (does NOT auto-persist).

### Edge function `ai-item-translate-apply`
- Validates payload shape matches canonical item structure (option count, rubric count).
- Upserts into `module_item_translations`.
- Logs into `module_item_revision_log` with `change_type='translation'` for audit continuity.

### UI
- Extend `ItemRewriteSheet.tsx` with a **"Translate"** tab next to "Rewrite":
  - Language picker (preset list: Bengali, Spanish, French, Arabic, Hindi, Indonesian, Portuguese — driven by config not hardcoded in component).
  - Side-by-side: canonical (left, read-only) vs AI translation (right, editable).
  - Apply button writes to `module_item_translations`.
- Badge in `ItemBankAnalyticsPanel` row showing translation count: e.g. `🌐 3 langs`.

### Learner runtime
- Out of scope for this phase (no learner-facing language switch yet). Translations sit in DB ready for Phase 4 i18n. This is intentional — ship author tooling first, validate quality, then expose.

---

## Part B — Cross-Course Authoring Insights

### RPC `get_authoring_trends(_instructor_id uuid, _days int default 30)`
SECURITY DEFINER, admin or self-instructor only. Returns aggregate across **all** modules the instructor authors:

```
{
  totals: { courses, modules, items, flagged_items, translated_items },
  flag_breakdown: { low_p_value, miscalibrated, low_rubric, stale, trivial },
  trend_7d_vs_prev_7d: { flagged_delta_pct, mastery_delta_pct },
  ai_assist: { rewrites_generated, rewrites_applied, translations_applied },
  hotspots: [ { course_id, course_title, flagged_count, top_flag } ],  -- top 5 worst courses
  wins: [ { course_id, course_title, flagged_resolved_30d } ]          -- top 3 most improved
}
```

Built from existing tables: `module_quiz_pool`, `module_scenario_pool`, `module_item_revision_log`, `authoring_digest_log`, `module_item_translations`.

### UI — `/app/instructor/insights`
New page (also linked from `InstructorReviewQueue` header as "Trends"):

```
┌──────────────────────────────────────────────────┐
│ Authoring Insights — last 30 days                │
├──────────────────────────────────────────────────┤
│ [Items: 412]  [Flagged: 23 ↓4]  [Mastery: 71% ↑] │
│ [AI rewrites applied: 18]  [Translations: 9]     │
├──────────────────────────────────────────────────┤
│ Flag breakdown (donut)   |  7-day trend (sparkline)│
├──────────────────────────────────────────────────┤
│ ⚠ Hotspot courses        |  ✅ Most improved      │
│ • Sales 101 (8 flags)    |  • Excel Basics (-6)   │
│ • Pitch Deck (5)         |  • SQL Intro (-3)      │
└──────────────────────────────────────────────────┘
```

- Recharts donut + sparkline (already in deps).
- Click a hotspot → deep link to that course's `InstructorReviewQueue` filtered view.
- Admin viewing `?instructor=<uuid>` sees any instructor's panel; instructors only see their own (RPC enforces).

### Weekly digest enhancement
Extend existing `authoring-review-digest` weekly mode to embed a "Your week in numbers" block at the top of each instructor email (uses same RPC). No new email template — just an extra section in the existing one.

---

## Files to create
- `supabase/migrations/<ts>_item_translations_and_trends.sql` — table + RLS + `get_authoring_trends` RPC
- `supabase/functions/ai-item-translate/index.ts`
- `supabase/functions/ai-item-translate-apply/index.ts`
- `src/hooks/useItemTranslate.ts`
- `src/hooks/useAuthoringTrends.ts`
- `src/pages/app/InstructorInsights.tsx`
- `mem://product/multilingual-items-and-authoring-trends`

## Files to edit
- `src/components/learning/ItemRewriteSheet.tsx` — add Translate tab + language picker
- `src/components/learning/ItemBankAnalyticsPanel.tsx` — show translation count badge
- `src/pages/app/InstructorReviewQueue.tsx` — add "View Trends" link in header
- `supabase/functions/authoring-review-digest/index.ts` — embed weekly numbers block
- `supabase/functions/_shared/transactional-email-templates/authoring-review-digest.tsx` — render new block
- `src/App.tsx` — register `/app/instructor/insights`
- `.lovable/plan.md`, `mem://index.md`

---

## Approval options

- **"continue with 3.8"** — ship both A (multilingual) and B (trends). Recommended: completes Phase 3.
- **"continue with 3.8.A"** — multilingual only.
- **"continue with 3.8.B"** — trends only.
