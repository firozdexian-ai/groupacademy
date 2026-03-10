

# Industries Manager — Audit Report

## Current State
493 lines. Already has mobile card layout and desktop table split (`md:hidden` / `hidden md:block`). Functionally solid with merge and rename operations. Fewer issues than other tabs.

## Issues Found

### 1. KPI cards use oversized `StatsCard` component
Lines 244-262: Same `StatsCard` that caused alignment problems in Contacts. Needs compact `p-3` cards.

### 2. Pagination buttons show text on mobile
Lines 401-422: "Previous" and "Next" text buttons — should be icon-only on small screens.

### 3. Header buttons not compact on mobile
Lines 277-287: "Refresh" button shows full text. Merge button is fine (contextual).

### 4. Merge button in header area can get lost on mobile
When 2+ items selected, the Merge button wraps awkwardly at 393px alongside Refresh.

## Fix Plan

| # | Fix |
|---|-----|
| 1 | Replace `StatsCard` with compact `Card className="p-3"` matching Companies/Contacts pattern |
| 2 | Pagination: icon-only on mobile (`<span className="hidden sm:inline">`) |
| 3 | Refresh button: icon-only on mobile |
| 4 | Remove `StatsCard` import |

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/IndustriesManager.tsx` | All 4 fixes — compact KPIs, responsive pagination & header buttons |

No database changes needed. Lightweight pass — this tab is already well-structured.

