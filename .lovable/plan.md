

# Talent Pool Tab — Audit & Improvement Plan

## Issues Found

### Bug Fixes
1. **Outreach filters (no_portfolio, no_mock, etc.) break pagination** — These filters run client-side on the current page's 10 rows, so filtered counts are wrong and talents on other pages are invisible. Only `no_welcome` is server-side.
2. **CSV export only exports current page** — The toast says "(Current Page)" but admins likely expect all filtered results. Need an "Export All" option.
3. **Portfolio request dialog is never opened** — `setPortfolioDialogOpen(true)` and `setPortfolioTalent(talent)` are never called from the table. The dialog code exists but there's no button to trigger it.
4. **`TalentDetailDialog` lookup uses `ilike` on email** — case-insensitive match could return wrong talent if emails differ only by case (unlikely but technically incorrect; should use `eq` with normalized email).

### Mobile UI Issues
5. **Table is not mobile-friendly** — 6-column table with 7 action icon buttons per row overflows on mobile. Needs a responsive card layout on small screens.
6. **Filter row wraps poorly on mobile** — Three filter inputs + clear button stack awkwardly on narrow screens.
7. **TalentDetailDialog** — 6-tab `grid-cols-6` TabsList is cramped on mobile; tab labels get truncated.

### Improvements
8. **No quick stats summary** — Unlike other admin tabs, there are no KPI cards (total talents, new this week, with CV, without phone). Add summary cards at top.
9. **Action buttons are cryptic** — 7 icon buttons per row with no labels. On first use, admin has to hover each one. Group outreach actions into a dropdown menu.
10. **No "Create Portfolio" action in table** — The dialog exists but is inaccessible (see bug #3). Add it to the actions dropdown.
11. **Country filter limited to 15** — `COUNTRIES_WITH_PHONE.slice(0, 15)` arbitrarily caps the list. Should show all countries that have talents, or at minimum all countries.

### Refactoring
12. **Outreach button code is heavily duplicated** — 5 nearly identical tooltip+button blocks (lines 616-815). Extract a reusable `OutreachButton` component.
13. **WhatsApp link formatting duplicated** — `formatWhatsAppLink` exists in both `TalentPoolManager` and `TalentDetailDialog` with slightly different logic. Extract to a shared utility.

---

## Plan

### A. Fix Outreach Filters (Server-Side)
Move `no_portfolio`, `no_mock`, `no_salary`, `no_scorecard` filters to server-side using a NOT EXISTS subquery via `.not()` or an RPC function, so pagination counts are accurate.

### B. Mobile-Responsive Table
- On mobile (`< md`), render talent rows as compact cards instead of table rows
- Each card: name, profession badge, country flag, joined date, expandable actions row
- Collapse the 7 action icons into a dropdown menu with labeled items

### C. Add Summary KPI Cards
Add 4 stat cards above the table:
- Total Talents | New This Week | With CV | Without Phone
- Query these with `count` on load

### D. Refactor Outreach Buttons
Extract `<OutreachActionButton product={...} talent={...} />` component to eliminate ~200 lines of duplication.

### E. Fix Portfolio Dialog Trigger
Add "Create Portfolio" option in the actions dropdown menu.

### F. Fix CSV Export
Add option to export all filtered results (paginated fetch loop), not just current page.

### G. TalentDetailDialog Mobile Fix
Change `grid-cols-6` to a scrollable horizontal TabsList on mobile.

### H. Minor Fixes
- Remove `.slice(0, 15)` from country filter
- Normalize email in TalentDetailDialog query
- Extract shared `formatWhatsAppLink` utility

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/TalentPoolManager.tsx` | Major: add KPI cards, mobile card layout, refactor outreach buttons into sub-component, fix filters to server-side, fix CSV export, add portfolio trigger, remove country slice |
| `src/components/dashboard/TalentDetailDialog.tsx` | Mobile tabs fix, use shared WhatsApp util |
| `src/lib/utils.ts` (or new `src/lib/whatsapp.ts`) | Extract shared `formatWhatsAppLink` |

No database changes needed.

