## Sub-phase 2.1 — Immersive Course Player Polish

Tighten the existing 6-stage player so it feels deliberate, persistent, and keyboard-friendly. No new tables — reuses `enrollment_stage_progress` + `enrollments`.

---

### 1. Resume-where-you-left-off

`src/pages/ImmersiveCoursePlayer.tsx`
- On enrollment load, compute `lastModuleId` = `enrollment.current_module_id` (fallback: most recently progressed module from `enrollment_stage_progress`, fallback: first module).
- Compute `lastStage` = first incomplete stage (1–6) for that module; default to 1 if all complete or none started.
- Replace current `setCurrentModuleId(modules[0].id)` initializer with `setCurrentModuleId(lastModuleId)` and `setCurrentStage(lastStage)`.
- Fire `enrollments.update({ current_module_id, last_accessed_at: now() })` whenever module changes (debounced 500ms).

### 2. Stage transitions (visual polish)

`src/components/player/stages/StageShell.tsx` (new wrapper)
- Wrap each stage's content with framer-motion `<AnimatePresence mode="wait">` keyed by `stage`.
- Slide-fade transition (x: 24 → 0, opacity 0 → 1, 220ms).
- Reduced-motion respected via `useReducedMotion()`.

Apply by rendering `<StageShell stageKey={currentStage}>{stageNode}</StageShell>` in `ImmersiveCoursePlayer`.

### 3. Sticky stage header + progress rail

`src/components/player/StageNavigation.tsx` (edit existing)
- Make the stage chip strip `sticky top-0 z-30` with a subtle backdrop-blur.
- Show **module N / total** + **stage label** + a slim 6-segment progress bar (filled = completed, glowing = current).
- Add prev/next stage chevrons inline.

### 4. Keyboard navigation

`src/hooks/usePlayerHotkeys.ts` (new)
- `←` / `→` → previous / next stage (no-op if at boundary).
- `[` / `]` → previous / next module.
- `Enter` (when a "Mark complete" CTA is focusable) → triggers `handleStageComplete(currentStage)`.
- `?` → opens a small `ShortcutsDialog` listing keys.
- Disabled when `document.activeElement` is an input/textarea/contenteditable.

Wired into `ImmersiveCoursePlayer` via `usePlayerHotkeys({ onPrevStage, onNextStage, onPrevModule, onNextModule, onComplete })`.

### 5. Per-resource progress persistence

`src/hooks/useResourceProgress.ts` (new)
- Persists per `(enrollment_id, resource_id)` watch position (videos) + read state (links/files) using a single JSONB column `enrollment_stage_progress.resource_state` (added via migration — see §7).
- `VideoPlayer.tsx`: emit `onTimeUpdate` (throttled 5s) + `onEnded` → `useResourceProgress.update(resourceId, { sec, done })`.
- `ResourceViewer.tsx`: mark link/file resources as `done=true` after 3s focus or explicit "Mark done" click.
- LearnStage shows ✓ badge on completed resources and **resumes video at saved time**.

### 6. Auto-advance + smarter stage gating

`src/hooks/useStageProgress.ts` (edit)
- Once **all** resources in a stage are `done`, auto-trigger `handleStageComplete(stage)` (still requires confirm toast for Practice/Assess).
- Lock future stages behind incomplete prior stages — clicking a locked chip shows an inline tooltip "Complete Stage N first".

### 7. Tiny migration

```sql
ALTER TABLE public.enrollment_stage_progress
  ADD COLUMN IF NOT EXISTS resource_state jsonb NOT NULL DEFAULT '{}'::jsonb;
```
No new RLS — inherits existing policies.

### 8. Exit & resume UX

- "X" close button in player header → updates `current_module_id` + `last_accessed_at` then `navigate(-1)`.
- On `/dashboard` learning rail (existing): course cards already exist; ensure the "Continue" CTA links to `/courses/:slug` which the player already handles — **no new dashboard work**, just verify.

---

### Files

**New**
- `src/components/player/StageShell.tsx`
- `src/hooks/usePlayerHotkeys.ts`
- `src/hooks/useResourceProgress.ts`
- `src/components/player/ShortcutsDialog.tsx`

**Edited**
- `src/pages/ImmersiveCoursePlayer.tsx` — resume logic, hotkeys, debounced enrollment updates, StageShell wrapper.
- `src/components/player/StageNavigation.tsx` — sticky header + progress rail.
- `src/components/player/VideoPlayer.tsx` — resume + persist watch time.
- `src/components/player/ResourceViewer.tsx` — done-marking.
- `src/hooks/useStageProgress.ts` — auto-advance + gating.

**Migration**
- Add `resource_state jsonb` to `enrollment_stage_progress`.

---

### Out of scope (deferred to 2.2)
- `module_progress` table + auto-recompute of `enrollments.progress` (whole next sub-phase).
- Adaptive difficulty (2.3).
- Certificates on completion (2.4).

Reply **continue** to implement (migration first, then hooks, then UI wiring).