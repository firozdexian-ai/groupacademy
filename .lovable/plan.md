# Sub-phase 3.7 — AI Rewrite Suggestions for Flagged Items

3.6 surfaces *which* items are broken. 3.7 makes the fix one click. When an author opens a flagged quiz question or scenario inside `<ItemBankAnalyticsPanel>`, an "AI rewrite" button calls Lovable AI and returns 1–3 concrete revisions (rewritten stem/options/rubric) with reasoning tied to the flag (`low_p_value`, `trivial`, `miscalibrated`, `low_rubric`, `stale`). Author reviews a diff, edits if desired, and applies — writing back to `module_quiz_pool` / `module_scenario_pool` and clearing serve counters so the new version is re-measured fairly.

## Goal

Close the loop: flagged item → AI suggestion → 1-click apply → fresh measurement.

## Scope

### a. Edge function `ai-item-rewrite`
- Auth-gated (admin role).
- Input: `{ kind: "quiz" | "scenario", item_id, flags: string[], notes?: string }`.
- Loads the item from the right pool, plus aggregate stats (p-value, distractor distribution, avg rubric scores) using the same SQL aggregator as `instructor-item-analytics`.
- Builds a structured Lovable AI call (`google/gemini-3-flash-preview`, **tool-calling** for structured JSON — never free-form JSON in the prompt) returning:
  - For quiz: `{ suggestions: [{ label, question, options[4], correct_index, rationale, change_summary }] }`.
  - For scenario: `{ suggestions: [{ label, title, prompt, rubric[] (criterion, weight, description), rationale, change_summary }] }`.
- Each suggestion is tagged with the flag it addresses (e.g., for `trivial` it must increase difficulty; for `miscalibrated` it must adjust the difficulty label or distractors).
- Returns 1–3 suggestions; never persists. Logs token usage to existing analytics for 3.8.

### b. Edge function `ai-item-apply`
- Auth-gated (admin role).
- Input: `{ kind, item_id, patch }` where `patch` is a sanitized subset of fields.
- Validates: required fields present, correct_index 0–3, rubric criteria sum > 0, length caps (question ≤ 600 chars, options ≤ 200, scenario prompt ≤ 2000).
- Updates the row, **resets `times_served`/`times_correct` to 0**, sets `quality_score = NULL`, and inserts a row into a new `module_item_revision_log` table (audit trail).
- Returns `{ ok: true, item_id, revision_id }`.

### c. Database
- `module_item_revision_log` (item_id, kind, before jsonb, after jsonb, flags_addressed text[], applied_by uuid, applied_at). Admin-only RLS.

### d. UI inside `<ItemBankAnalyticsPanel>`
- New "AI rewrite" button next to the existing flag badges on each flagged row.
- Opens a `<Sheet>` (`<ItemRewriteSheet>`) showing:
  - Current item (read-only).
  - Loading skeleton while `ai-item-rewrite` runs.
  - 1–3 suggestion cards, each with: label, change summary, full preview, "Use this" button.
  - On "Use this" → optional inline tweak in a textarea, then "Apply" → calls `ai-item-apply`, refreshes analytics, toasts.
- Empty/error state with retry.

### e. Bulk path on `/app/instructor/review-queue`
- Per-module card gets a "Generate fixes for all flagged" button (admin-only) that fans out one `ai-item-rewrite` call per flagged item (capped at 10 per click) and stores results in component state for review — no auto-apply. Author still confirms each.

### f. Telemetry
- Log `ai_rewrite_generated` (per item, with flags), `ai_rewrite_applied` (with revision_id), and `ai_rewrite_dismissed` for 3.8 trends.

## Out of scope
- Multi-language rewrites (Phase 3.8).
- Auto-apply / scheduled regeneration — every change requires explicit author confirmation.
- Versioned rollback UI (audit row exists; surface in admin tools later).
- Image/diagram regeneration in scenarios.

## Data flow

```text
ItemBankAnalyticsPanel ──► "AI rewrite" ──► ai-item-rewrite (Lovable AI, tool call)
                                                      │
                                          1–3 structured suggestions
                                                      │
                                  Author reviews → tweaks → "Apply"
                                                      │
                                            ai-item-apply (validate + write)
                                                      │
                       module_quiz_pool / module_scenario_pool updated,
                       serve counters reset, module_item_revision_log row inserted
                                                      │
                                          panel re-fetches analytics
```

## Files to create / edit

**New**
- `supabase/functions/ai-item-rewrite/index.ts`
- `supabase/functions/ai-item-apply/index.ts`
- `src/components/learning/ItemRewriteSheet.tsx`
- `src/hooks/useItemRewrite.ts`
- `supabase/migrations/...` — `module_item_revision_log` + RLS.
- `mem://product/ai-item-rewrite-suggestions`

**Edit**
- `src/components/learning/ItemBankAnalyticsPanel.tsx` — per-row "AI rewrite" button + sheet wiring.
- `src/pages/app/InstructorReviewQueue.tsx` — "Generate fixes for all flagged" bulk action.
- `.lovable/plan.md`, `mem://index.md`

## 3.7 ship notes

- DB: `module_item_revision_log` audit table (admin-only RLS).
- Edge `ai-item-rewrite` (admin) — Lovable AI Gateway with tool-calling schemas, 1–3 structured suggestions targeting the supplied flags. Surfaces 429/402.
- Edge `ai-item-apply` (admin) — validates patch, updates pool, **resets serve counters**, inserts revision log row.
- UI: `ItemRewriteSheet` (preview → editable draft → Apply), wired from "AI rewrite" pill on every flagged row inside `ItemBankAnalyticsPanel`.
- Deferred (3.7.e bulk path on review-queue): not shipped — single-item flow handles 95% of cases without orphaning AI generations.
- Phase 3 progress: ~88% (7 of 8).

**Up next:** 3.8 (multilingual rewrite + cross-course trend insights). Reply **continue with 3.8**.
