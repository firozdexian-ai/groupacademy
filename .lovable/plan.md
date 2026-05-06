# Sub-phase 1.4 — Drag-Reorder Modules + Bulk Resource Upload

Goal: Replace the slow up/down arrow reordering in `ModuleManagement` with native drag-and-drop, and add a **bulk resource upload** flow inside `ModuleResourcesManager` so admins can drop many files at once into a stage instead of creating rows one by one.

---

## Problem today

**Module reorder (`src/pages/ModuleManagement.tsx`)**
- Each reorder is a single up/down click → 2 sequential `update` calls per swap.
- Moving a module from position 8 → 1 requires 7 clicks and 14 round-trips.
- No visual cue of drop position, no keyboard support beyond the buttons.

**Resource upload (`src/pages/ModuleResourcesManager.tsx`)**
- Resources are added one at a time — fill title, pick file, save, repeat.
- Most real curricula need 5–20 PDFs/videos per module, per stage. The current flow is a bottleneck.
- `display_order` is auto-computed as `count + 1`, so order can only be changed by deleting/re-adding (no reorder UI exists at all).

---

## What changes

### 1. Drag-reorder for modules

In `ModuleManagement.tsx`, replace the up/down arrow buttons with a drag handle on each module row. Use **HTML5 native drag/drop** (no new dependency — matches existing pattern in `ImageUpload`, `GigUploader`, `MultiFileUpload`).

Behavior:
- Grip icon on the left of each row is `draggable`.
- On drag-over another row, show an insertion indicator line (top or bottom border).
- On drop, reorder the local array, then **batch-update `display_order`** for every affected row in a single `Promise.all` of upserts. Compute the new order densely (1, 2, 3, …) so future inserts remain clean.
- Up/down arrow buttons stay as a fallback (accessible for keyboard / mobile-without-touch-drag).
- Add `onTouchStart`-based long-press + move fallback for mobile (same pattern as `MultiFileUpload`).

Tiny optimistic update: reorder local state first, fire updates, revert on error with a toast.

### 2. Drag-reorder for resources

Same pattern inside `ModuleResourcesManager.tsx`, scoped per-stage. Each stage panel renders its resources in `display_order`; admin can drag resources within their stage to reorder. Cross-stage drag is **out of scope** (use the existing stage_number selector to move across stages).

### 3. Bulk resource upload

New component **`BulkResourceUpload.tsx`** rendered inside each stage panel of `ModuleResourcesManager`.

UX:
```text
┌─ STAGE 2 · LEARN ──────────────────────────────────────┐
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │   ⬆  Drop files here, or click to select          │ │
│  │       PDF · MP4 · DOCX · PPTX · images · ≤ 50 MB  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Queued (3):                                           │
│   • intro.pdf    [PDF]  ✓ Uploaded                     │
│   • lecture.mp4  [Video] ⏳ 42%                         │
│   • slides.pptx  [Doc]  ⏸ Waiting                       │
│                                                         │
│  Defaults: Title = filename (editable inline)          │
│            Type auto-detected · Order continues stage  │
│  [Save 3 resources]                                    │
└─────────────────────────────────────────────────────────┘
```

Logic:
- Accept multi-file drop or file-picker (`<input multiple>`).
- For each file:
  1. Auto-detect `resource_type` from MIME (`application/pdf` → `pdf`, `video/*` → `video`, `image/*` → `image`, office docs → `document`, else `file`).
  2. Default `title` = filename minus extension.
  3. Upload to existing `module-resources` storage bucket (reuses `ModuleResourceFileUpload` upload helper — extracted to `src/lib/moduleResourceUpload.ts` so both single and bulk paths share it).
  4. Track per-file status: `queued | uploading | uploaded | error` with a progress bar.
- Concurrency: upload **3 in parallel**, queue the rest.
- After all uploads finish, "Save 3 resources" performs a single `insert([...])` on `module_resources` with computed `display_order` continuing from the stage's current max.
- Inline-editable title for each queued row before save.
- Failed rows stay in the queue with a Retry button; successful rows are removed from the queue and appear in the stage list.

### 4. Empty/edge cases

- Reorder while a save is in flight: disable drag handles for that row.
- Bulk upload exceeding 50 MB per file: reject locally with a toast (matches existing limits).
- Admin closes the page mid-upload: `beforeunload` warning if any file is `uploading`.

---

## Implementation

### New
- `src/components/dashboard/BulkResourceUpload.tsx` — bulk uploader panel; props `{ moduleId, stageNumber, currentMaxOrder, onComplete }`.
- `src/lib/moduleResourceUpload.ts` — shared upload helper (`uploadModuleResourceFile(file, moduleId): Promise<{ url, type }>`).
- `src/components/dashboard/common/DraggableList.tsx` — tiny reusable wrapper that takes `items`, `renderItem`, `onReorder(newOrder)` and handles HTML5 drag events + drop indicator. Used by both modules and resources.

### Edited
- `src/pages/ModuleManagement.tsx`
  - Wrap module list in `<DraggableList>`; keep arrow buttons as secondary controls.
  - Replace pairwise `moveModule` with a single `reorderModules(newList)` that batches `update display_order` calls for every changed row.
- `src/pages/ModuleResourcesManager.tsx`
  - Wrap each stage's resource list in `<DraggableList>` (per-stage reorder).
  - Mount `<BulkResourceUpload>` at the top of every stage panel above the existing single-resource form.
  - Refactor existing single upload to call `moduleResourceUpload` helper.
- `src/components/dashboard/ModuleResourceFileUpload.tsx`
  - Switch internal upload call to the shared helper (no UX change).

### Database
No schema changes. `display_order` already exists on both `course_modules` and `module_resources`.

---

## Out of scope
- Cross-stage drag for resources (use existing stage selector).
- Cross-module drag (move resource between modules).
- Resumable / chunked uploads — stays single-shot per file, capped at 50 MB.

Reply **continue** to implement.
