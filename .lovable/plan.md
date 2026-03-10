

# Lead Hunter Tab — Audit & Improvement Plan

## Issues Found

### Bug Fixes
1. **No `created_by` filter on sessions query** — The sessions list fetches ALL sessions from all admins (`select("*")`). Should filter by the current user or at minimum show who created each session.
2. **Session detail header buttons not mobile-friendly** — Export buttons overflow on small screens; "Back" + title + 2 buttons don't fit.
3. **New Hunt dialog `grid-cols-2` breaks on mobile** — Job title and company name fields stack poorly on narrow screens.

### Mobile UI Issues
4. **Matches table overflows on mobile** — 6-column table (checkbox, candidate, skills, initial score, AI score, actions) doesn't fit on small screens. Needs card layout.
5. **Analysis dialog hardcoded `max-w-2xl`** — On mobile this is fine but the `grid-cols-2` breakdown cards inside it are cramped.

### Improvements
6. **No KPI summary** — No stats showing total sessions, total matches found, shortlisted count across sessions.
7. **No search/filter on sessions list** — Can't search sessions by job title or filter by status.
8. **No "Score All" button** — Admin has to click "Score" individually for each candidate. Add a "Score All Unscored" batch action.
9. **No delete session** — Once a hunt session is created, it cannot be removed.
10. **Session cards show no match count** — Sessions list only shows title, company, date, and status. Should show how many matches were found.
11. **No link to talent detail** — Clicking a candidate name in matches should open the `TalentDetailDialog` from the talent pool, connecting the two tabs.

### Refactoring
12. **`useDebounce` hook defined inline** — Already exists as a pattern elsewhere; minor but could be shared. Since it's only used here and is 7 lines, leave it.

## Plan

### A. Add KPI Cards
Add 3 stat cards at the top:
- Total Sessions | Total Matches Found | Total Shortlisted
- Query with `count` on `lead_hunt_sessions` and `lead_hunt_matches`

### B. Mobile-Responsive Matches View
- On mobile, render matches as cards instead of table rows
- Each card: name, email, skills badges, scores side-by-side, shortlist checkbox, action buttons
- Wrap session detail header buttons responsively

### C. Add Session Search + Match Count
- Add a search input to filter sessions by job title (client-side on current page is fine given pagination)
- Fetch match count per session using a joined count or separate query, show as badge on session cards

### D. Add "Score All" Batch Action
- Button in session detail view: "Score All Unscored"
- Iterates through matches without `ai_match_score`, calls `score-talent-match` sequentially with progress indicator

### E. Add Delete Session
- Add a delete button (with confirmation) on each session card
- Cascade deletes matches (already set up in DB via foreign key)

### F. Connect to Talent Detail
- Import `TalentDetailDialog` and open it when clicking a candidate name in the matches view

### G. Fix New Hunt Dialog for Mobile
- Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`

### H. Fix Session Query Security
- Add `.eq("created_by", userId)` filter or fetch current user and filter — requires getting the auth user in the component

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/LeadHunterManager.tsx` | KPI cards, mobile card layout for matches, session search, match count on session cards, Score All button, delete session, talent detail link, responsive dialog, created_by filter |

No database or edge function changes needed.

