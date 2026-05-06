# Sub-phase 1.3 — Live Readiness Checklist Sidebar

Goal: Replace the small "Catalog Status" card in `ContentEdit` with a comprehensive **Readiness Sidebar** that lists every requirement for the course to go live, shows pass/fail per item, and links the admin straight to the field that needs fixing. Works for all five `content_type`s with type-specific rules.

---

## What's wrong today

- The existing readiness card only checks module playability and shows a generic "X modules blocking" list.
- Nothing surfaces missing cover image, missing description, missing event date, missing meeting link for live, missing instructor, missing pricing, etc.
- No way to see *why* a course can be `is_published=true` but still hidden by `is_ready=false`.
- No CTA — admin has to scroll back up and hunt for the field.

---

## New "Readiness" sidebar (replaces existing audit card)

Lives in the right column (sticky on desktop) and shows:

```text
┌─ READINESS ────────────────────────────────┐
│  6 / 8 checks passed       72% ░░░░░░░░    │
│  Status: Inactive — fix 2 blockers         │
├────────────────────────────────────────────┤
│ ✅ Cover image set                         │
│ ✅ Title & slug present                    │
│ ✅ Description ≥ 200 chars                 │
│ ⚠ Pricing not configured     [Set price] │
│ ❌ No instructor assigned     [Add]       │
│ ✅ 4 modules · all playable                │
│ ✅ Event date in future (live)             │
│ ⚠ No meeting link (live)     [Add link]  │
├────────────────────────────────────────────┤
│ [Recompute readiness]   [Force publish ⓘ] │
└────────────────────────────────────────────┘
```

### Check rules per `content_type`

Universal:
- Cover image set
- Title present, slug present and url-safe
- Description ≥ 200 chars
- Pricing: `price >= 0` AND (`price > 0` ⇒ currency set, OR explicit "Free")
- Profession line/level set (warning only — not a blocker)

Recorded course / free video extra:
- ≥ 1 module
- Every module is "playable" (existing rule — video URL or resource)
- Reuses existing `moduleAudit` list as drill-down

Live webinar / batch class extra:
- `event_date` set
- `event_date` is in the future (warning if past + still published)
- `event_timezone` set
- `event_duration_minutes` set
- Instructor name present
- Meeting link OR YouTube stream URL present
- For batch class: ≥ 1 row in `course_sessions`

Offline seminar extra:
- `event_date` set
- `venue_name` and `venue_address` set
- `max_capacity` set

### Per-check anchor scrolling

Each row's CTA scrolls smoothly to the related field and flashes a ring around it. We add `data-readiness-field="cover_image"` attributes on the relevant inputs and the sidebar uses `document.querySelector` + `scrollIntoView` + a one-shot ring class.

### "Force publish" advanced action

Tucked behind a tooltip explaining: "Bypasses readiness gate. The talent app's live filter still hides items where `is_ready=false`." Sets `is_published=true` only — does not flip `is_ready` (DB trigger owns that).

### Recompute readiness

Calls a tiny edge function `recompute-content-readiness` that re-runs the same DB logic the trigger uses, in case the trigger missed an event. (Implemented as a stored function `public.recompute_content_readiness(content_id uuid)` invoked via `supabase.rpc`.)

---

## Mobile behavior

Sidebar sits below the form on mobile. A persistent floating "Readiness X/Y" pill at the bottom-right opens it as a Sheet. All field-jump CTAs work the same way after closing the sheet.

---

## Implementation

### New
- `src/components/dashboard/ContentReadinessChecklist.tsx` — pure UI, takes `formData`, `moduleStats`, `moduleAudit`, `sessionCount`. Computes checks, renders list, exposes `onJumpToField(name)` and `onRecompute()`.
- `src/lib/contentReadiness.ts` — pure function `computeChecks(formData, moduleStats, moduleAudit, sessionCount): Check[]` so it's unit-testable and can be reused later in ContentList tooltip.
- (DB) Migration: `public.recompute_content_readiness(p_content_id uuid)` — wraps the existing trigger logic, callable via RPC.

### Edited
- `src/pages/ContentEdit.tsx`
  - Replace the current "Catalog Status" card with `<ContentReadinessChecklist />`.
  - Add `data-readiness-field="…"` attributes on: cover image, title, slug, description, price, instructor_name, event_date, event_duration_minutes, max_capacity, venue_name, whatsapp_group_link, youtube_url.
  - Pass `sessionCount` (already loaded in Sessions tab — lift it once) for the batch-class check.
  - Add mobile floating pill + Sheet wrapper.
- `src/components/dashboard/ContentReadinessBadge.tsx` — left as-is (compact pill in lists). The new checklist is a richer surface, not a replacement for the badge.

---

## Files

**New**: `ContentReadinessChecklist.tsx`, `lib/contentReadiness.ts`, one migration adding `recompute_content_readiness` RPC.
**Edited**: `src/pages/ContentEdit.tsx`.

## Out of scope
- Auto-AI suggestions to fix each check (Sub-phase 1.5 covers AI helpers).
- Real-time recompute via realtime subscription (manual button is enough now).

Reply **continue** to implement.
