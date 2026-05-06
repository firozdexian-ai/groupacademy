# Sub-phase 2.4 — Post detail + carryover fixes

Three things in this turn: two carryover fixes you just flagged, then the main 2.4 work (post detail view & deep linking). Hype goes universal as part of 2.4 since the detail view is the natural place to consume it.

## Part A — Carryover fixes (small)

### A1. Animated profile-card backdrop is missing
The backdrop component is wired up correctly — it just queries `profile_card_themes` and there are **zero rows in the table** right now (confirmed via DB). So nothing renders, by design.

Two parts to the fix:
- **Seed one default theme** (a soft Tech Blue → Cyan gradient) marked `is_active=true`, `priority=0`, no start/end date. This gives every user a baseline animated/gradient backdrop out of the box.
- **In the admin Profile Card Theme Manager**, when the table is empty show a one-click "Create default theme" CTA so you don't have to fill the form manually next time.

You won't need to touch the admin panel — the seed will populate immediately. After that, any theme you create with higher priority will take over.

### A2. Compose Post overflows when expanded
At 390px the expanded composer footer breaks out of the card because the icon row + counter + Post button don't wrap and the textarea has no horizontal padding offset. Fix in `ComposePost.tsx` only:
- Wrap the bottom row with `flex-wrap gap-y-2`, give the action icons a min-width-0 container, push counter + Post button to the right with `ml-auto`.
- Constrain the tag input row to `max-w-full overflow-hidden` and shrink the textarea to `w-full` (currently inherits implicit width from absent box-sizing on the parent).
- Remove the lingering empty `<div>` after the icons that creates the overflow.

No behavior change, purely layout.

## Part B — Universal Hype

Today `HypeButton` and the underlying `hype_post` RPC only target `feed_posts`. We expand it to cover **courses, videos, articles (blogs), and any future feed item**.

### Approach
Add a polymorphic table + RPC, identical economics (1 credit, 80/20 split):

```sql
create table public.content_hypes (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talents(id) on delete cascade,
  content_type text not null check (content_type in ('post','course','video','blog')),
  content_id uuid not null,
  credits numeric(12,1) not null default 1,
  created_at timestamptz default now()
);
create index on content_hypes (content_type, content_id);
```

A new RPC `hype_content(_type, _id)`:
- Resolves the creator (`talents.user_id` for posts; `content.created_by` for courses/videos; `blog_posts.author_id` for blogs).
- Deducts 1 credit from caller (free → earned), credits 0.8 to creator's earned wallet, 0.2 to platform — same logic as `hype_post`.
- Inserts a row in `content_hypes`.
- Increments a denormalized `hype_count` per content type (add `hype_count int default 0` to `content` and `blog_posts`; `feed_posts` already has it — keep both RPCs, the new one is the only one new code calls).

`feed_posts` keeps its existing column. Posts route through `hype_content('post', id)` going forward; the old `hype_post` stays for back-compat.

A new `useUniversalHype(contentType, contentId, initialCount)` hook mirrors `useHype` but takes a content type. `HypeButton` accepts `contentType?: 'post'|'course'|'video'|'blog'` (defaults to `'post'`).

### Where it appears
- `PostCard` → unchanged usage (still posts).
- `FeedCardRedesigned` (courses/videos/blogs) → add the same Hype button to its action row, alongside Save and Share.
- Course detail page, blog post detail page → same button in the header actions.

Self-hype is blocked (mirrors `CANNOT_HYPE_SELF`).

## Part C — Post detail view & deep linking (the actual 2.4)

### Route
```
/app/feed/post/:id
```

Renders a single `feed_posts` row in a focused, full-width view (still mobile-vertical). Used by:
- The Share button (already links to `?post=`; switch to the proper URL).
- Notifications.
- External previews (OpenGraph).

### Components
- `src/pages/app/PostDetail.tsx` — fetches the post by id, renders `<PostCard>` at the top, then a full `<CommentList>` (not in a sheet — inline, expanded).
- `<RelatedPosts>` — same author or shared tags, 3–5 cards below comments.
- Back button in the header → `navigate(-1)` with fallback to `/app/feed`.

### Deep-linking
- `PostActionBar`'s share URL becomes `/app/feed/post/${id}` instead of `?post=`.
- `Feed.tsx`: if `?post=<id>` is still on the URL (legacy notifications), redirect to the new route.

### SEO / sharing
- `PostDetail` sets `<title>` to the first 60 chars of `text_content` and a meta description from the next 160 chars.
- JSON-LD `SocialMediaPosting` block with author, datePublished, articleBody.
- OpenGraph image: post media if present, else a generated default.

### Empty / error states
- Loading: skeleton card.
- Not found / unpublished: "This post isn't available." with a button back to the feed.

## Acceptance checklist

- Profile card shows a gradient/animated backdrop on a fresh load with no admin setup needed.
- Empty Theme Manager shows a "Create default theme" CTA.
- Compose Post: at 390px, expanded composer fits inside the card; counter + Post button never overflow.
- Hype button appears on courses, videos, and articles in the feed and on their detail pages.
- Hype across all content types deducts 1 credit, splits 80/20, blocks self-hype, and shows the right toasts.
- `/app/feed/post/:id` renders the post, full comment thread, and related posts.
- Share from `PostActionBar` produces a URL that opens the detail view directly.
- Detail view has a proper title, meta description, and JSON-LD.

## Out of scope

- Comment threading depth > 1 (already simple list).
- Realtime comment updates (poll on focus is enough for now).
- Hype leaderboards across content types — later phase.

After 2.4 ships → **2.5: Notifications & realtime hype/comments badges.**
