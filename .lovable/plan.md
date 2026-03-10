

# Jobs KPI Dashboard — Mobile/Web UI Compatibility Fix

## Issues at 391px viewport

After reviewing the code against the 391px mobile viewport:

### 1. Hero Card — Too Tall on Mobile
The circular progress (w-28 h-28) centers above the full stats block. Combined with the title, edit button, progress bar, and 3 stat boxes stacking to `grid-cols-1`, this creates a very long vertical scroll before reaching any other content. On mobile, the hero section should be more compact.

**Fix**: On mobile, use a horizontal layout for the hero — small circle on the left, key stats on the right. Change `flex-col lg:flex-row` to `flex-row` always, but shrink the circle further on mobile (`w-20 h-20`). Change the 3-stat grid from `grid-cols-1 sm:grid-cols-3` to `grid-cols-3` always (they're small number cards).

### 2. StatMiniCard Grid — Orphan Cards
9 potential cards in `grid-cols-2` = one card alone on the last row. The icon + text layout inside each card wastes horizontal space on mobile.

**Fix**: Make icon smaller on mobile (`w-3 h-3` / `p-1.5`), reduce font size for value (`text-lg` on mobile), and tighten padding (`pt-3 pb-2 px-3`).

### 3. Bar Chart X-Axis — 30+ Labels Cramped
On mobile at 391px, 30 day labels on the XAxis overlap and become unreadable.

**Fix**: Add `interval` prop to XAxis to show every 5th label on mobile. Use `useIsMobile` hook.

### 4. Recent Jobs — Date Badge Wrapping
The vacancies/applications/date row uses `flex items-center gap-4` which can overflow on narrow screens.

**Fix**: Reduce gap to `gap-2` and use `text-xs` for the stat values on mobile.

### 5. Header Title + Button Spacing
"Jobs Analytics" title and "Refresh" button are fine, but "Monthly Jobs Target" + "Edit Target" button stack awkwardly. The edit input row (w-24 input + 2 buttons) can also overflow.

**Fix**: Make the edit input `w-20` on mobile.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/JobsKPIDashboard.tsx` | All 5 mobile fixes above |
| `src/components/dashboard/CircularProgress.tsx` | Add smaller mobile size (`w-20 h-20`) |

No database changes needed.

