# UGC & Contents (Group #9) Deep Audit

Scope: 5 sidebar tabs (Overview, Free Videos, Blog Posts, Feed Posts, Competitions) — 5 components + 1 hook, ~952 LOC, tables `content`, `blog_posts`, `feed_posts`, `competitions`, `content_reports`.

DB state: `content` 1,105 rows (7 free_video, 1,094 recorded_course, 4 misc), `blog_posts` 16, `feed_posts` 14, `competitions` 3, `content_reports` 0.

## Findings

### 🔴 Critical bugs (UI is genuinely broken right now)

- **U1 — Free Videos tab queries the wrong column AND the wrong scope.**
  `useUgcGraph` line 19 selects `id, title, type, status, created_at` from `content`, but the column is `content_type`, not `type`. Result: every row returns `type: undefined`, the "Classification" cell renders empty. It also pulls all 1,105 `content` rows (including 1,094 recorded courses) and labels them "Free Videos." The `Deploy Video` dialog then writes `{ type: "video", title, status }` — `type` is a non-existent column and `slug` (NOT NULL), `content_type` (NOT NULL enum), and `description` are all missing. Insert fails or writes garbage.
  Fix: filter `content_type = 'free_video'`, use `content_type` everywhere, and expand the form to capture `slug`, `description`, `youtube_url`, `thumbnail_url`, `is_published` — the columns that actually exist.

- **U2 — Feed Posts tab queries a non-existent column.**
  Hook line 21 selects `content` from `feed_posts`. The actual column is `text_content`. The tab's preview cell, length badge, and edit dialog all read/write `row.content` — every row shows "No text content" and saving writes to `content`, which fails or is silently dropped. Author column reads `author_user_id` which does exist. Form must use `text_content` and supply `author_user_id` (NOT NULL on insert) + `content_type` (enum, NOT NULL).

- **U3 — Blog Posts insert is impossible.**
  `blog_posts.slug` is NOT NULL; the dialog only captures `title` + `status`. First "Inject Article" click on a fresh row → 23502 NOT NULL violation. Same for `excerpt`, `content`, `category`, `featured_image`, `author_id` (RLS will likely reject without it). Add the full editor + auto-slugify title.

- **U4 — Competitions insert is impossible.**
  `competitions.slug` is NOT NULL; dialog captures only `title` + `status`. First "Deploy Tournament" → 23502 violation. Also missing `description`, `start_date`, `end_date`, `submission_deadline`, `prizes` (jsonb), `category`, `featured_image`, `max_participants`. Need a richer 2-column form with date pickers.

- **U5 — `useUgcGraph` mutation factory anti-pattern.**
  Same Rules-of-Hooks violation we already cleaned in HR-Z2 and GTM-Z1. `createUpsertMutation` / `createDeleteMutation` call `useMutation` inside non-hook helpers, then are invoked 10× in the return block. Inline the 10 mutations or wrap as `useUpsert()` / `useDelete()` real hooks (the GTM pattern).

### 🟠 Warnings

- **U6 — Hard 500-row caps.** Each table in the master query is `.limit(500)`. With 1,105 `content` rows the "Free Videos" KPI tile (which counts ALL content rows) is **already lying** by 605 nodes, and any new content beyond 500 will silently disappear from every screen. Two fixes: (a) tab queries should be filtered + paginated, (b) Overview KPIs should come from a `get_ugc_dashboard()` RPC returning real `count(*)` per scope.
- **U7 — `confirm()` browser dialogs × 4** (videos, blog, feed, competitions). Breaks the brutalist theme — same fix we applied in GTM-Z1 (reuse the new `ConfirmPurge` component or lift it to `dashboard/common`).
- **U8 — Moderation Queue is read-only and dead-end.** Pending reports render with a truncated `scope_id` and an "Awaiting Review" badge — there is no "Resolve", "Dismiss", "Open content" action and no link to the reported entity. Today the table is empty (0 rows) so it looks fine; the moment a real report lands, admins can't do anything with it. Add resolve/dismiss buttons that update `content_reports.status` + capture `resolved_by`, and a "View" link that deep-links into the right tab.
- **U9 — Overview KPIs miscount.** "Free Videos" tile counts every row in `content` (1,105), not free_videos (7). "Blog Posts" / "Feed Posts" / "Competitions" tiles also count whatever the 500-row sample returned, not the true total. Move counts to RPC.
- **U10 — Author cells show first-8-chars of UUID.** Both Blog and Feed tabs display raw author UUID slices instead of resolving names. Join via `talents.full_name` (Blog) / `feed_posts.author_name` (already on row, but ignored) — or surface in a single RPC.
- **U11 — No filters / no pagination on any registry.** Even after fixing the 500 cap, browsing 1,000+ articles or feed posts requires search + pagination. At minimum: search-by-title, status filter, and "Load 50 more".
- **U12 — Feed dialog allows admins to edit any user's post body without surfacing who they're editing.** No author label, no warning, no audit trail. At least show the original author handle in the dialog header and keep the edit explicit.
- **U13 — Pulse bars use hard-coded max (500 / 100).** Once real volume kicks in, every bar pegs at 100% forever. Either drop the bars or compute max from the actual rollup.
- **U14 — Reports `scope` enum not constrained in UI.** When we add resolve actions, ensure we recognise the full enum (`feed_post`, `comment`, `blog`, `video`, `competition`, etc.). Today the cell uses `scope.replace("_"," ")` which is fine but no canonical list anywhere.

### ✅ What works

Brutalist styling matches the rest of the dashboard; competitions table cells render cleanly; loading skeletons present; report tile + KPI grid layout are solid; sidebar group order is correct.

## Did we strip anything in earlier passes?

No. There are no `{/* ... */}` placeholder fragments, no "pending Phase X" notes, and no bare `null`-returning panels. The bugs above are pre-existing schema drift and unfinished forms, not regressions from prior cleanup.

## Phase UGC-Z1 plan (must-fix this pass)

| ID | Fix | Files |
|---|---|---|
| U1 | Videos tab: query `content` filtered to `content_type='free_video'`, select `content_type`, expand dialog to (slug auto, description, youtube_url, thumbnail_url, is_published) | `useUgcGraph.ts`, `UgcVideosTab.tsx` |
| U2 | Feed tab: select `text_content` (alias to `content` if we want to keep current cell code, or rename throughout), edit dialog writes `text_content`. Show `author_name` instead of UUID slice. Insert path requires `author_user_id` + `content_type` defaults | `useUgcGraph.ts`, `UgcFeedTab.tsx` |
| U3 | Blog dialog: full editor — title (auto-slug), excerpt, body (markdown + preview tabs reusing the helper from GTM-Z1), category, featured_image, status, is_featured. `author_id` defaults to `auth.uid()` | `UgcBlogTab.tsx` |
| U4 | Competition dialog: 2-col form — title (auto-slug), description, category, featured_image, start_date, end_date, submission_deadline, prizes JSON textarea, max_participants, status | `UgcCompetitionsTab.tsx` |
| U5 | Inline 10 mutations in `useUgcGraph` (drop factory) | `useUgcGraph.ts` |
| U6 + U9 | New `get_ugc_dashboard()` RPC returning real counts (`free_videos`, `blogs`, `feed_posts`, `competitions`, `pending_reports`); Overview consumes it instead of `.length` on capped arrays | DB migration; `UgcOverviewTab.tsx` |
| U7 | Lift `ConfirmPurge` to `dashboard/common/ConfirmPurge.tsx`; replace 4 `confirm()` callsites | new shared file; 4 tab files |
| U8 | Add Resolve / Dismiss / View buttons on each row of the moderation queue, + DB column `resolved_by` (uuid) on `content_reports` if missing | `UgcOverviewTab.tsx` (+ migration if column missing) |

## Stretch (same pass if room)

- **U10** — show resolved author names in Blog + Feed (cheap join in the same RPC) (~+30)
- **U11** — search input + status filter on each registry (~+40 each)
- **U13** — derive PulseBar max from RPC totals so bars stop pegging (~+10)

## Defer

- **U12** — proper "audit trail" on admin edits to user feed posts (needs a `content_audit_log` table — own phase)
- **U14** — scope enum centralisation (cosmetic, ship after Resolve actions exist)

## Memory

After ship: update `mem://admin/groups-7-to-10-stakeholder-structure` with "UGC-Z1 closed" line covering schema-drift fix, `get_ugc_dashboard()` RPC, ConfirmPurge lift, resolvable moderation queue.

## Out of scope

- Admin-side gigs / marketplace (separate group)
- Public-facing /blog, /feed, /competitions routes (no UI changes here)
- Notification fanout for resolved reports
