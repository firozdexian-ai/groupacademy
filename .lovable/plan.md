

# Learning Section (Group 4) — Full Audit Plan

## Components to Fix

| Component | Lines | Issues |
|-----------|-------|--------|
| **ContentList.tsx** | 377 | Pagination text on mobile |
| **EnrollmentsManager.tsx** | 447 | Oversized KPIs, no mobile card layout, pagination/header text on mobile |
| **LearnerProgressManager.tsx** | 392 | Oversized KPIs (CardHeader pattern), no mobile card layout for 2 tables, fixed-width course selector, hardcoded colors |
| **BatchContentGenerator.tsx** | 757 | KPI summary uses `text-2xl` (minor), tab triggers clip on small screens, draft action buttons can wrap awkwardly on mobile |

---

## Fix Details

### 1. ContentList.tsx — Light polish
- Pagination (lines 344-349): Hide "Previous"/"Next" text on mobile with `hidden sm:inline`

### 2. EnrollmentsManager.tsx — Medium rebuild
- **KPI card** (lines 257-265): Replace `CardContent pt-4` with compact `p-3` card pattern
- **Header buttons** (lines 273-278): Icon-only on mobile for Refresh and Export
- **Table** (lines 343-416): Add `sm:hidden` mobile card layout with checkbox, name, content, status badge, and status action selector
- **Pagination** (lines 422-441): Icon-only on mobile, compact page counter

### 3. LearnerProgressManager.tsx — Medium rebuild
- **Header** (lines 203-223): Make course selector full-width on mobile (`w-full sm:w-[280px]`), stack vertically, reduce heading to `text-lg`
- **KPI cards** (lines 226-269): Replace `CardHeader + CardContent` pattern with compact `p-3` cards in `grid-cols-2 md:grid-cols-4`
- **Course Performance table** (lines 280-306): Add `hidden sm:block` desktop table and `sm:hidden` mobile card layout showing course name, total/active/completed counts, and completion progress
- **Individual Learners table** (lines 327-380): Same mobile card pattern — name, status badge, enrolled date, progress bar
- **Hardcoded colors**: Replace `bg-green-500/10 text-green-600` etc. with semantic badge variants where possible

### 4. BatchContentGenerator.tsx — Light polish
- **Tab triggers** (line 447): Already uses `grid-cols-3 sm:grid-cols-4 lg:grid-cols-7` and hides labels on mobile — mostly fine. Reduce icon size on smallest screens if needed.
- **KPI summary** (lines 474-487): Already uses `grid-cols-3 gap-3 p-3` — close to standard. Change `text-2xl` to `text-lg` for consistency with other tabs.
- **Draft review buttons** (lines 637-643): Ensure "Approve All" / "Reject All" don't wrap — use icon-only on mobile.
- **School status list** (lines 601-621): Progress bar width `w-24` can overflow on 393px — change to `w-16 sm:w-24`.

---

## Files to Change

| File | Effort |
|------|--------|
| `src/components/dashboard/ContentList.tsx` | 2 lines |
| `src/components/dashboard/EnrollmentsManager.tsx` | ~80 lines (mobile cards + KPI + buttons) |
| `src/components/dashboard/LearnerProgressManager.tsx` | ~90 lines (mobile cards for 2 tables + KPI + header) |
| `src/components/dashboard/BatchContentGenerator.tsx` | ~15 lines (text sizing + responsive tweaks) |

No database changes needed.

