

# Admin Panel — No Horizontal Scroll Fix

## Problem
The admin panel at 391px viewport can produce horizontal overflow from:
1. **Dashboard container** uses `p-6` (24px padding both sides = 48px eaten from 391px)
2. **SidebarInset** has no `overflow-x-hidden` — wide children (charts, grids) can push the page wider
3. **Chart containers** and card grids can exceed viewport width without containment
4. **Header** uses `px-6` which wastes space on mobile

## Fix Plan

### 1. Add `overflow-x-hidden` to SidebarInset usage in Dashboard.tsx
Add `overflow-x-hidden` class to `SidebarInset` to prevent any child from causing horizontal scroll.

### 2. Reduce mobile padding
- Dashboard `<main>` padding: `p-3 sm:p-6` (instead of fixed `p-6`)
- Header padding: `px-3 sm:px-6`

### 3. Add global admin overflow guard
Add `overflow-x-hidden` to the outer `div.min-h-screen` wrapper in Dashboard.tsx.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add `overflow-x-hidden` to wrapper + SidebarInset, reduce padding on mobile |

Single file, 3 line-level changes. No database changes.

