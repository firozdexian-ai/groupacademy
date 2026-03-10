

# Consolidate AI Description Generator into Batch Content Generator

## Current State

Two separate components with nearly identical code:

- `BatchDescriptionGenerator` (394 lines) — generates module descriptions, school-by-school, with progress tracking
- `BatchContentGenerator` (742 lines) — generates quizzes, flashcards, scenarios, course metadata, blog posts, feed posts with the same school-by-school pattern + draft approval for blog/feed

They share: school fetching logic, batch processing loop with rate-limit/error handling, progress bar, batch log, regenerate toggle, school status list. The Description Generator is essentially just another "school-based" generator type.

## Plan

### 1. Add "descriptions" as a 7th generator type in `BatchContentGenerator`

Add to the `GENERATORS` config:
```
"descriptions": {
  label: "Module Descriptions",
  icon: FileText,
  description: "Generate rich 5-7 bullet content guides for modules with short descriptions (<500 chars)",
  endpoint: "batch-generate-descriptions",
  batchSize: 3,
  needsSchool: true,
  countLabel: "descriptions",
}
```

Update the `fetchSchools` logic to handle `activeTab === "descriptions"` — count modules where `description.length < 500` as pending (same logic currently in `BatchDescriptionGenerator`).

### 2. Delete `BatchDescriptionGenerator.tsx`

No longer needed — all its functionality absorbed into the unified component.

### 3. Update Dashboard routing

In `Dashboard.tsx`:
- Remove `BatchDescriptionGenerator` import
- Map the `"ai-descriptions"` tab to `<BatchContentGenerator />` (or merge both admin tabs into one)
- Simplest approach: remove the separate "ai-descriptions" sidebar item and have one "AI Content Tools" entry that includes all 7 generator types

### 4. Update tab grid layout

Change `grid-cols-6` to accommodate 7 tabs — use a scrollable `TabsList` or `grid-cols-4 lg:grid-cols-7`.

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/BatchContentGenerator.tsx` | Add "descriptions" generator type, add description-specific pending logic in `fetchSchools` |
| `src/components/dashboard/BatchDescriptionGenerator.tsx` | Delete |
| `src/pages/Dashboard.tsx` | Remove BatchDescriptionGenerator import, point "ai-descriptions" tab to BatchContentGenerator (or merge tabs) |
| `src/components/dashboard/AdminSidebar.tsx` | Remove "ai-descriptions" sidebar item if merging into single entry |

