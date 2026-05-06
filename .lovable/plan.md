# Sub-phase 2.1.6 (polish) + Sub-phase 2.2 (Reactions & card actions)

Two things in this turn: small fixes to the feed shell from your feedback, then the full plan for 2.2.

---

## Part A — Feed shell polish

### A.1 Profile card — remove Messages, promote Level to the right
- Drop the Messages icon button from `FeedHeader.tsx`. Messages is already reachable from the bottom nav and from the Quick Actions row (after A.2).
- Right-side slot becomes a compact **Level badge**:
  ```text
  ┌──────────────────────────────────────────────┐
  │ (avatar)  Rakib Hasan                  ╭───╮ │
  │           Founder · Bangladesh         │Lv4│ │
  │           ⚡ 3,830 cr  ▓▓▓▓▓▓░░ 62%   ╰───╯ │
  └──────────────────────────────────────────────┘
  ```
  - Pill: rounded-xl, primary tint, `Lv {n}` on top line, `{label}` tiny below (e.g. "Achiever").
  - Tap opens the same Career Level sheet we just built.
- The thin progress bar + % stays inline next to the wallet chip (where it is now).

### A.2 Quick Actions — 4 agents + 5th tile "View all agents"
- Drop `VISIBLE_LIMIT` to **4**. Same ranking math (personal usage → global popularity).
- The 5th cell in the `grid-cols-5` is a fixed "View all agents" tile that opens `QuickActionsSheet`.
- Remove the "View all agents →" text link below the grid (no longer needed).
- Tile styling: dashed border, muted bg, `Grid` icon, label "All agents" — visually distinct so it doesn't feel like an agent.

**Files**: `src/components/feed/FeedHeader.tsx`, `src/components/feed/QuickActionsGrid.tsx`. No DB changes.

---

## Part B — Sub-phase 2.2: Reactions & Card Actions

Goal: simplify every feed card to **three actions only — Hype, Comment, Share** — and make Hype the headline interaction (paid-reaction creator economy already exists in the schema; we wire it to the new bar).

### B.1 Action bar — collapse to 3 buttons
Current `PostCard.tsx` / `FeedCardRedesigned.tsx` carry a wider set (reactions menu, save, etc.). Replace the footer with a single row:

```text
┌────────────────────────────────────────────────┐
│  🔥 Hype · 1.2k    💬 Comment · 34    ↗ Share  │
└────────────────────────────────────────────────┘
```

- **Hype** (primary action)
  - Single tap = +1 hype (1 credit, 80/20 split per Creator Economy memo).
  - Long-press / hold = "Boost" sheet to send 5 / 10 / 25 hype at once.
  - Optimistic count update; rolls back on failure.
  - Daily free hype budget (existing): tap is free until budget runs out, then prompts wallet.
- **Comment**: opens existing `CommentList` in a bottom sheet (no inline expansion — keeps cards short).
- **Share**: opens existing `ShareSheet` (system share + copy link + WhatsApp).

Saved/Bookmark moves to the kebab `⋮` in the card header (along with Report, Mute author, Why am I seeing this). No save button in the action bar.

### B.2 Hype counter UI
- Numeric format: `1.2k`, `12.4k`, `1.1M`. No ambiguity for big posts.
- When the viewer has hyped, the icon flips to filled + colored (rose-500) and label changes to "Hyped".
- Top-3 hypers preview (avatars stacked) appears just above the action bar when hype ≥ 5 — taps open a "Top hypers" sheet.

### B.3 Card header cleanup
- Author row: avatar · name · profession · `· 3h`. Country chip moves to a small flag emoji next to name (or hidden on narrow viewport).
- Kebab `⋮` on the right with: Save, Share, Mute author, Report, Why this post (admin only: Pin, Hide).
- Drop the "verified shield" chip if author isn't verified (currently always renders on some cards).

### B.4 Backend
Most pieces already exist. We need:
- `feed_posts` already has `hype_count`. Confirm.
- `feed_post_hypes` table (per-user-per-post hype quantity) — check existing schema; if missing, add:
  ```sql
  create table public.feed_post_hypes (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references public.feed_posts(id) on delete cascade not null,
    talent_id uuid not null,
    quantity int not null default 1,
    credits_spent numeric(12,1) not null default 1,
    created_at timestamptz not null default now()
  );
  ```
- Edge function `add-post-hype` (new): verifies auth, deducts credits via existing wallet logic, writes ledger entry, increments `feed_posts.hype_count`, returns new total. Idempotent on `(post_id, talent_id, created_at_minute)` to swallow double-taps.
- View `feed_post_top_hypers(post_id)` returning top 3 by quantity for the avatar stack.

### B.5 Frontend files touched
- `src/components/feed/PostCard.tsx` — strip reactions menu, replace footer with 3-action bar.
- `src/components/feed/FeedCardRedesigned.tsx` — same treatment if still in use; otherwise consolidate to `PostCard`.
- `src/components/feed/HypeButton.tsx` — extend with hold-to-boost gesture + boost sheet.
- `src/components/feed/ReactionBar.tsx` — delete (replaced).
- `src/components/feed/PostAuthor.tsx` — kebab menu with Save / Mute / Report.
- New: `src/components/feed/HypeBoostSheet.tsx`, `src/components/feed/TopHypersSheet.tsx`.
- New: `supabase/functions/add-post-hype/index.ts`.

### B.6 Validation
- Single tap on Hype: count goes up by 1, balance ticks down by 1, button fills.
- Hold Hype: Boost sheet opens; pick 10 → 10 credits debited, count +10, ledger shows entry with `kind='hype_outgoing'`.
- Tap Comment: bottom sheet opens with existing comment thread, can post.
- Tap Share: native share sheet.
- Kebab → Save: post appears in `/app/saved`.
- 390px viewport: no horizontal scroll, action bar fits comfortably.

---

After this sub-phase ships → **2.3: Community Filter System** (Global / My Country / My Profession / Content Type tabs).