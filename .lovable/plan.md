

# Applications Manager — Audit Report

## Current State
908 lines. Server-side paginated with status/delivery filters. Includes assessment detail dialog, CSV export, manual forward, WhatsApp notification, and inline status change. Search is disabled (commented out). Two filters work well.

---

## Bugs

### 1. Table with 8 columns causes horizontal scroll on mobile
Lines 700-868: Table has Applicant, Job, Type, AI Score, Status, Delivery, Applied, Actions columns. At 390px this forces side-scrolling.

### 2. Assessment Dialog overflows on mobile
Line 147: `max-w-3xl` dialog with `grid md:grid-cols-2` content. The tabs text ("Summary & Insights", "Score Breakdown", "Detailed Responses") overflow at 390px.

### 3. Status Select inside table cell is cramped
Line 771: `w-32` SelectTrigger inside a table cell — on mobile this competes with other columns for space.

### 4. Search is completely disabled
Lines 640-650: Search input is commented out with a note about complexity. Users have no way to find specific applications by name or job.

---

## UI / Mobile Fixes

### 5. Replace table with card list on mobile
On `< 640px`, render each application as a compact card showing:
- Applicant name + email (top line)
- Job title + company (second line)
- Status badge + Delivery badge + AI score inline
- Date + action icons row
Hide Type column (show as small badge on card if email type).

### 6. Assessment Dialog: full-screen on mobile
Change to `max-w-full sm:max-w-3xl` with `h-[90vh]` on mobile. Shorten tab labels to "Summary", "Scores", "Details".

### 7. Filter bar: stack vertically on mobile
Two selects already use `w-full md:w-48` — this is fine. Keep as-is.

### 8. Enable client-side search within fetched page
Uncomment and implement search input that filters the current page's applications by applicant name, email, job title, or company name. Not perfect but better than nothing.

### 9. Pagination: simplify on mobile
Use icon-only prev/next buttons on mobile (remove "Previous"/"Next" text).

---

## Improvements

### 10. KPI summary cards at top
Add 4 compact stats: Total Applications, Pending Delivery, Shortlisted, Failed — derived from the current filter context (or a separate count query).

---

## Consolidated Fix Plan

| # | Category | Fix | Priority |
|---|----------|-----|----------|
| 1 | Bug/Mobile | Table → card list on mobile | High |
| 2 | Bug/Mobile | Assessment Dialog full-screen + shorter tabs | High |
| 3 | UX | Enable client-side search on current page | Medium |
| 4 | Mobile | Pagination icon-only on mobile | Medium |
| 5 | Feature | KPI summary cards at top | Medium |

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/JobApplicationsManager.tsx` | All fixes: mobile card layout, dialog sizing, search, pagination, KPI cards |

No database changes needed.

