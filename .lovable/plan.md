## Action 1 — Add the 13 missing entries to `TAB_TITLES`

### Why
`src/pages/Dashboard.tsx` derives the page header from `TAB_TITLES[activeTab]`, falling back to `"Nexus Console"` when a key is missing. A diff of `TAB_COMPONENTS` vs `TAB_TITLES` shows **13 keys** that have a lazy component but no title — so 13 admin tabs currently render the generic "Nexus Console" header instead of their real name. There are also **4 stale title keys** with no matching component that should be removed in the same edit.

### The 13 missing keys (component → header to add)

Using the exact labels already used in `AdminSidebar.tsx` so the sidebar item and the page header match word-for-word:

| Tab key | Title to add |
|---|---|
| `hr-workforce` | `Workforce` |
| `gigs-overview` | `Gig Economy Overview` |
| `gigs-scoper` | `AI Scoper Queue` |
| `gigs-quick-actions` | `Quick Action Gigs` |
| `gigs-marketplace` | `Marketplace Gigs` |
| `gigs-course-projects` | `Course Projects` |
| `gigs-client-projects` | `Client Projects` |
| `gigs-managed-projects` | `Managed Projects` |
| `gigs-submissions` | `Gig Submissions` |
| `gigs-verification` | `Verification Queue` |
| `gigs-reviewers` | `Reviewer Program` |
| `gigs-matchmaker` | `Gig Matchmaker` |
| `gigs-workers-wallet` | `Workers Wallet` |

Note: `gigs-overview` and `gigs-scoper` both load `GigOverviewTab` but live as separate sidebar entries, so each gets its own label rather than collapsing them.

### The 4 stale title keys to remove

These titles exist but no `TAB_COMPONENTS` key resolves to them, so they're dead weight:

- `community-wa-channel` (replaced by `marketing-community-wa`)
- `course-projects` (replaced by `gigs-course-projects`)
- `marketplace-gigs` (replaced by `gigs-marketplace`)
- `gig-submissions` (replaced by `gigs-submissions`)

### Where to place them

In `src/pages/Dashboard.tsx`, the `TAB_TITLES` object (lines 318–465) is loosely grouped by domain (overview, CRM, jobs, learning, marketing, abroad, agents, finops, IR, HR, GTM, …). I will insert each new entry in its matching domain block so the file stays readable:

- `hr-workforce` → inside the **HR block** (after `"hr-overview"` on line 445), before `"hr-grades"`.
- All 12 `gigs-*` entries → as a new **"Gig Economy"** block placed right after the `finops-*` block (after line 422) and before the blank line / `ir-*` block. This mirrors the order in `AdminSidebar.tsx` (group #12) and keeps related labels co-located.
- The 4 stale keys (`community-wa-channel`, `course-projects`, `marketplace-gigs`, `gig-submissions`) → delete in place (lines 327, 412, 413, 414).

### Patch shape

```text
src/pages/Dashboard.tsx
  - line 327     remove  "community-wa-channel": "Community WhatsApp Line",
  + after 422    insert  // ===== Gig Economy =====
                          "gigs-overview":         "Gig Economy Overview",
                          "gigs-scoper":           "AI Scoper Queue",
                          "gigs-quick-actions":    "Quick Action Gigs",
                          "gigs-marketplace":      "Marketplace Gigs",
                          "gigs-course-projects":  "Course Projects",
                          "gigs-client-projects":  "Client Projects",
                          "gigs-managed-projects": "Managed Projects",
                          "gigs-submissions":      "Gig Submissions",
                          "gigs-verification":     "Verification Queue",
                          "gigs-reviewers":        "Reviewer Program",
                          "gigs-matchmaker":       "Gig Matchmaker",
                          "gigs-workers-wallet":   "Workers Wallet",
  - lines 411-414 remove  gigs / course-projects / marketplace-gigs / gig-submissions stale entries
  + after 445    insert  "hr-workforce": "Workforce",
```

### Scope guarantees

- Single file touched: `src/pages/Dashboard.tsx`.
- No component, route, sidebar, or business-logic changes.
- Pure cosmetic — eliminates 13 "Nexus Console" headers and 4 dead keys.

### Verification after build

1. Open `/dashboard?tab=hr-workforce` → header reads "Workforce" (not "Nexus Console").
2. Click each of the 12 Gig Economy sidebar entries → header matches the sidebar label exactly.
3. Re-run the diff script — `Missing` and `Extra` arrays should both be empty.
