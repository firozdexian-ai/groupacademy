# Sub-phase 2.5 — Hype verification + agentic feed notifications

Two things this turn:
1. **Confirm and surface** that the Hype credit economy actually moves credits, end-to-end, with a visible Transactions entry.
2. **Realtime feed notifications** delivered by **AI General** into the existing notification center (NOT a Messenger-style rewrite).

---

## Part A — Hype economy verification & visibility

### What's already correct (verified in DB)
- `hype_post(post_id)` and `hype_content(type, id)` both:
  - Debit 1 credit from sender (priority: bonus → free balance → earned).
  - For posts: credit 0.8 to creator's `earned_balance`; remaining 0.2 stays as platform margin.
  - For courses/videos/blogs: full 1 credit to platform (no creator yet — by design until creator payouts go live).
  - Insert two `credit_transactions` rows (`service_type='hype'`, `source='hype_sent'` / `'hype_received'`).
  - Insert into `post_hypes` / `content_hypes` and bump the `hype_count`.

So the backend is fine. What's missing is **proof to the user**.

### What we add
1. **Transactions page entry**
   - Open `src/pages/app/Transactions.tsx` (bKash-style ledger). Confirm `hype_sent` and `hype_received` rows render with proper labels, icons (▲ Hype) and -1 / +0.8 badges. If the page filters by `service_type` whitelist, add `'hype'`. Group "Hype sent / Hype received" under the existing "Engagement" or add an "Engagement" section.
2. **Wallet drawer micro-toast**
   - When `useHype` / `useContentHype` succeed, the toast says "▲ Hype sent · -1 credit · New balance: X.X" so the debit is unmissable. Pull fresh balance from `talent_credits` after the RPC.
3. **Recipient earning toast (only for post hype)**
   - For the recipient, the realtime notification (Part B) carries `+0.8 earned`. Tap goes to Transactions.
4. **One-time backfill check**
   - Run a read-only audit query in the migration that asserts every `post_hypes` row has matching `credit_transactions(source='hype_sent')` and `(source='hype_received')`. If any mismatch, log it. (Today: 0 rows so it passes trivially — but locks the invariant for the future.)
5. **Self-hype guard surfaced**
   - `CANNOT_HYPE_SELF` already raises in `hype_post`. Add the same guard for `hype_content` post path (already routes through `hype_post`, so covered) and for the future when creator IDs are added to courses/videos/blogs.
6. **Idempotency / spam control**
   - Add a partial unique index `(sender_talent_id, content_id, content_type)` on `post_hypes` and `content_hypes` to **prevent the same user hyping the same item twice within 24h** (cheap dedup using a check column `created_at::date`). Today the UI already disables the button after one hype but we want a DB guarantee. *(Open question — could be relaxed if you want repeat hype as a "stack" mechanic; flag noted in plan, default = one hype per item per user.)*

### Acceptance for Part A
- Hyping a friend's post: my balance drops by 1, their `earned_balance` rises by 0.8, both rows show in Transactions, my toast confirms the debit.
- Trying to hype my own post → blocked with a friendly toast.
- Trying to hype the same post twice → toast "Already hyped" (no double debit).
- Transactions page lists all `service_type='hype'` rows under a clear "Hype" section.

---

## Part B — Realtime feed notifications (agentic, NOT Messenger)

**Direction confirmed**: notifications stay as **AI General messages** dropped into the existing notification center. We are NOT turning this into a chat surface and NOT touching the Messenger inbox (which remains for talent-to-talent + agent marketplace).

### What changes
- New server-side triggers create `notifications` rows when feed engagement happens.
- Every row is **branded as from AI General**: standardized `icon`, an `agent='ai_general'` flag (new column or stored in an `extras jsonb`) so the dropdown can render the AI General avatar + name on the message.
- Realtime stream into the bell badge is already live via `useNotifications` — we just need the new rows to flow.

### Trigger surface
- `AFTER INSERT ON post_hypes` → notify post author. Title from AI General: "{sender_name} hyped your post · +0.8 credits". Link → `/app/feed/post/{post_id}`.
- `AFTER INSERT ON content_hypes` (course/video/blog) → notify creator if known; otherwise skip (platform-only hype, no recipient).
- `AFTER INSERT ON post_comments` → notify post author. If `parent_comment_id` set, also notify parent commenter (`feed_reply`).
- Mention parser on `feed_posts` and `post_comments` insert → resolve `@handle` → notify mentioned talents (cap 5 per body, dedupe vs author/parent).

### Helper
`SECURITY DEFINER` function `notify_talent_from_ai_general(_talent_id, _type, _title, _message, _link)` that:
- Checks recipient's `notification_preferences` and skips if disabled.
- Dedups: if an unread row of same `(type, link)` exists from the last 60s, update its `message`/`created_at` instead of inserting a duplicate.
- Sets the icon/persona so the UI knows it came from AI General.

### UI updates (light)
- `NotificationDropdown.tsx`: render the AI General avatar + name on each row's left edge so the agentic framing is obvious. Unread badge count on the bell.
- Bottom-nav Feed icon shows a small dot when there are unread `feed_*` notifications and you're not on `/app/feed`.
- `/app/feed`: floating "New posts ↑" pill subscribes to `feed_posts` inserts; tap re-runs the recommendations query. (Doesn't insert into the visible list to avoid scroll thrash.)
- `/app/feed/post/:id`: subscribes to `post_comments` for that post and appends in place.

### Light preferences
New table `notification_preferences (talent_id, channel text, enabled bool)` with channels `feed_hype`, `feed_comment`, `feed_reply`, `feed_mention`. Default = enabled. A small section in Settings with four toggles. `notify_talent_from_ai_general` consults this before inserting.

### Acceptance for Part B
- Hype, comment, reply, or `@mention` produce a notification authored visually by AI General within ~1s, no refresh.
- Bell badge updates live; bottom-nav dot appears for unread feed events when off the feed.
- "New posts ↑" pill appears on the feed when new posts arrive.
- Comments on the open post detail appear without refresh.
- Disabling a channel in Settings stops new rows of that type immediately.
- Notifications page still looks like the agentic feed it is today — no Messenger UI changes.

---

## Technical details

### New / modified files
- `supabase/migrations/<ts>_hype_dedup_and_feed_notifs.sql`
  - Unique-ish index on hype tables.
  - Triggers + `notify_talent_from_ai_general` helper.
  - `notification_preferences` table + RLS.
  - Add publication entries for `feed_posts` and `post_comments` realtime.
- `src/hooks/useUnreadCount.ts` (derived from `useNotifications`).
- `src/hooks/useFeedRealtimeIndicator.ts`.
- `src/components/feed/NewPostsPill.tsx`.
- `src/components/notifications/NotificationDropdown.tsx` — AI General avatar + badge.
- `src/pages/app/Notifications.tsx` — group by day, AI General persona row, mark-as-read on open.
- `src/pages/app/Transactions.tsx` — ensure `service_type='hype'` rows render under an Engagement / Hype section.
- `src/hooks/useHype.ts`, `src/hooks/useContentHype.ts` — toast with "-1 credit · new balance".
- `src/components/settings/NotificationChannels.tsx` — four toggles.

### Out of scope
- Push notifications (web push / FCM).
- Email digests of feed activity.
- Repeat-hype stacking mechanic (default = one per user per item).
- Any change to the Messenger inbox surface.
- Creator payouts on course/video/blog hype (whole credit stays with platform until that lands).

After 2.5 ships → **2.6: Creator analytics dashboard (per-post reach, hype, comment, save, share funnels).**
