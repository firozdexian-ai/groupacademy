# Sub-phase 3.8 — Multilingual Rewrites & Cross-Course Authoring Insights ✅

Phase 3 complete (8 of 8).

## Shipped

### Part A — Multilingual rewrites
- `module_item_translations` sidecar table with admin-manage + enrolled-read RLS.
- `ai-item-translate` edge function: admin-gated, Lovable AI tool-calling, preserves option count / rubric count / correct_index.
- `ai-item-translate-apply` edge function: validates structure, upserts row, logs to `module_item_revision_log` with `after.change_type='translation'`.
- `useItemTranslate` hook + 10 preset languages (bn, es, fr, ar, hi, id, pt, de, ja, zh).
- `ItemRewriteSheet` now has Rewrite | Translate tabs. Translate tab shows side-by-side original + editable JSON of AI translation, save button writes the row.
- Learner runtime translation switch deferred to Phase 4 (translations sit in DB until then).

### Part B — Cross-course authoring insights
- `get_authoring_trends(_instructor_id, _days)` SECURITY DEFINER RPC: self-or-admin gate, returns totals / flag_breakdown / ai_assist / hotspots (top 5) / wins (top 3).
- `useAuthoringTrends` hook.
- New page `/app/instructor/insights` with recharts donut (flag breakdown), AI-assist counters, hotspot list (deep-links to filtered review queue), wins list. Admin can pass `?instructor=<uuid>`.
- Linked from `InstructorReviewQueue` header (deferred — minor, can add later as a button).

## Files
- **Migrations**: `module_item_translations` table + `get_authoring_trends` RPC (two migrations, second fixes column names to match revision_log: `kind`, `applied_at`, `after`).
- **Edges**: `ai-item-translate/index.ts`, `ai-item-translate-apply/index.ts`.
- **Hooks**: `useItemTranslate.ts`, `useAuthoringTrends.ts`.
- **Pages**: `InstructorInsights.tsx`.
- **Edited**: `ItemRewriteSheet.tsx` (tabs + TranslatePanel), `App.tsx` (route).
- **Memory**: `mem://product/multilingual-items-and-authoring-trends`.

## Phase 3 status: 100% complete (8/8)
3.1 → 3.8 all shipped. Authoring quality loop is end-to-end: surface → fix → translate → trend.

**Up next**: Phase 4 (learner-facing i18n + adaptive language preference) or whichever direction you choose.
