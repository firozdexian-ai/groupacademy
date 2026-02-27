

# Remove Sort Dropdown from Feed Filters

## Problem
The "Best Match / Newest" sort dropdown between the content filter tabs and the feed cards creates unnecessary blank space and an extra UI element. The feed should always show content sorted by newest first (with pinned posts on top), which is already the default behavior.

## Changes

### 1. Remove Sort Dropdown UI (`src/components/feed/FeedFilters.tsx`)
- Delete the entire `Select` dropdown section (the "Sort Dropdown" block, lines 81-92)
- Remove the `handleSortChange` function since it's no longer needed
- Remove the `Select` component imports
- Change the outer wrapper from `space-y-2` to just the grid (no vertical spacing needed for a single element)

### 2. Hard-code Sort to "newest" (`src/hooks/useFeedRecommendations.ts`)
- Remove the `filters.sort` logic in the `filteredItems` sorting — always sort by newest (createdAt descending), with pinned posts first
- Remove the `FeedSortType` export (or keep for backwards compatibility but ignore it)
- The default filter initializer already uses `sort: "newest"`, so no change needed there

### Files Modified

| File | Change |
|------|--------|
| `src/components/feed/FeedFilters.tsx` | Remove sort dropdown and its imports |
| `src/hooks/useFeedRecommendations.ts` | Remove sort-based branching in `filteredItems`, always sort by newest |

This is a small, additive change on top of the other feed redesign items (profile card, feed cards, quick actions, etc.) and will be implemented alongside them.
