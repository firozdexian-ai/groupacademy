# Gig Hub: 4-Tab Layout

**Quick answer to "do unclaimed projects show?":** Yes. The list pulls every `course_projects` row with status `open / claimed / in_progress`, regardless of whether you've claimed it. So a freshly published, unclaimed project does appear (as long as `is_published = true` and `status = open`).

## Restructure `/app/gigs` from 2 tabs → 4 tabs

Today: **Earn** (everything mashed together) + **My Work**.
New:

```
[ Quick Tasks ] [ Course Projects ] [ Client Projects ] [ My Work ]
```

| Tab | Source | Purpose |
|---|---|---|
| Quick Tasks | `gigs` table | 1-tap micro gigs (CV upload, job sharing, etc.) |
| Course Projects | `course_projects` (published, open/claimed/in_progress) | Build-a-course bundles |
| Client Projects | `marketplace_gigs` (approved/active) | Employer-posted freelance work |
| My Work | submissions + bids + contracts | Everything I've engaged with |

### Edits to `src/pages/app/Gigs.tsx`

1. **Tab state**: replace the `earn / work` collapse with a 4-value tab (`tasks / course / client / work`). Add back-compat so old `?tab=earn` lands on `tasks` and `?tab=projects` lands on `course`.
2. **TabsList**: change `grid-cols-2` → `grid-cols-4`, add `BookOpen` (Course) and `Briefcase` (Client) triggers next to existing Quick + My Work.
3. **Split the existing Earn content into 3 tab panels**:
   - `tasks` panel: keep the search + Quick Tasks grid only.
   - `course` panel: move the Course Projects section here, full-width (no longer "below the fold"). Keep the same card UI; show empty-state when none.
   - `client` panel: promote the marketplace peek into a real list (not just 6). Remove the "See all → /app/marketplace" button since this tab _is_ the list. Add a small CTA at top: "Post a gig" only if the user has employer access (skip for v1, just show the list).
4. **My Work** panel: untouched.
5. **Search**: keep one search box at the top of each list tab (tasks/course/client), each filtering its own list.
6. **Marketplace query**: bump `limit(6)` → `limit(50)` and reuse for the Client tab.

### No DB / route changes needed
- Course projects already include unclaimed ones (status `open`).
- Marketplace listing route stays at `/app/marketplace` for the standalone deep link, but the in-hub Client tab now covers the same need.

### Files touched
- `src/pages/app/Gigs.tsx` (only file)

Approve and I'll ship it.
