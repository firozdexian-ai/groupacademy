# Creator Economy — Remaining Roadmap

We've shipped the foundation: Hype button, paid connection requests, inbox gate, talent directory, and public profiles. Here's how we land the rest, broken into 5 shippable phases. Each phase is independent and can be approved one at a time.

---

## Phase 3 — Connections Inbox & DM Loop (next up)

Right now a user can *send* a request, but recipients have nowhere to see/accept them, and once accepted there's no actual messaging surface. This closes the loop.

**Build:**
- **Connection Requests inbox** at `/app/connections` — pending received, sent, accepted tabs.
- Accept / decline buttons calling existing `talent_connection_respond` RPC (already shipped).
- On accept → auto-create a `messaging_threads` row between both talents → redirect to existing `/app/messages/:threadKey`.
- Notification triggers: "X wants to connect (Y credits escrowed)", "Z accepted your request", "Refunded — request expired".
- Badge on bottom nav profile icon when pending received > 0.
- Nightly cron edge function `connection-expiry-sweep` to refund 14-day-old pending requests.

---

## Phase 4 — Hype Visibility & Creator Earnings Surface

Hype works but creators can't see what they earned, and viewers can't discover hyped content.

**Build:**
- **"Hype Earnings" card** on `/app/withdrawals` — total received, last 30 days, top hyped post.
- **Top Hyped This Week** sidebar widget on `/app/feed` (read from `feed_posts.hype_count` ordered desc, last 7 days).
- **Creator badges** on profile + post author chip: 🔥 500 / 🔥 1k / 🔥 5k cumulative hypes received → auto-grant via trigger on `post_hypes` insert.
- Animated hype counter (live realtime subscription on `feed_posts.hype_count`).
- Self-hype client-side block + server-side guard already exists — just need the toast UX.
- Hype rate-limit (50/post/user/day) enforced in `hype_post` RPC.

---

## Phase 5 — Discovery, Search & Profile Boost

Make the directory actually useful at scale.

**Build:**
- **Filters** on `/app/talents`: country, profession, skill, "open inbox only", sort by hype / volume / recency.
- Full-text search on talent name + skills + profession (Postgres `tsvector` index).
- **Profile Boost**: spend 100 credits → pin your card to top of directory results for 24h. New `talent_boosts` table + `boost_until` column.
- Public profile gets: recent posts, hype timeline chart, connection price live indicator.
- SEO: server-rendered meta tags for `/app/talents/:id` so profiles are shareable and indexable.

---

## Phase 6 — Admin Creator Economy Console

Give ops visibility + abuse controls.

**Build:**
- New tab in admin Talent group → **"Creator Economy"**.
- Metrics: total hype volume, connection revenue (last 7/30/90d), top earners, top spenders, pending-request backlog, refund rate.
- Abuse flags: users with >100 hypes/day sent, suspicious sender→recipient loops (collusion), connection requests with >50% decline rate.
- Manual controls: freeze a talent's hype receiving, force-refund a stuck connection, adjust connection price floor.
- Wire into existing `/dashboard?group=talent` admin shell.

---

## Phase 7 — Phase 2 Gamification (the "interesting layer")

The extras you originally floated. Save these for after Phases 3–6 prove the core loop monetizes.

**Build:**
- **Comment tips** — same 1-credit micro-payment on comments, 90/10 split.
- **Hype streaks** — receive ≥10 hypes 5 days running → bonus 50 credits (cron job + `streak_state` table).
- **Weekly leaderboard payout** — top 10 hyped creators get 2× multiplier on next week's earnings.
- **Verified Creator badge** — auto-grant at 10k cumulative hypes, unlocks 85/15 split (vs default 80/20).
- **Referral-to-connection** — A introduces B to C → A earns 10% of connection fee. New `connection_referrals` table.
- **Per-DM micro-fees** for top creators (opt-in, set their own per-message price, 70/30 split).

---

## Suggested Order

```text
Phase 3 (loop)  →  Phase 4 (visibility)  →  Phase 5 (discovery)
                          ↓
                    Phase 6 (admin)  →  Phase 7 (advanced gamification)
```

Phases 3 + 4 are the highest leverage — without them the system is technically live but invisible. I'd suggest shipping Phase 3 immediately on approval, then Phase 4 right after.

---

## Technical Notes

- **New tables (Phase 5–7)**: `talent_boosts`, `comment_tips`, `streak_state`, `connection_referrals`. All RLS-gated to owner-only writes, public-readable counters.
- **New edge functions**: `connection-expiry-sweep` (Phase 3, cron), `hype-streak-tick` (Phase 7, cron), `tip-comment` (Phase 7).
- **New RPCs**: `accept_connection_creates_thread`, `boost_profile`, `claim_creator_badge`.
- **Realtime**: subscribe `feed_posts` for live hype counter (Phase 4); subscribe `talent_connections` for inbox badge (Phase 3).
- **Triggers**: badge auto-grant on `post_hypes` insert; `feed_posts.hype_count` denorm already in place.
- **Cron**: Supabase `pg_cron` for nightly expiry sweep + weekly leaderboard payout.
- **Memory**: extend `mem://product/creator-economy-hype-and-connections` after each phase.

---

**Tell me which phase to start with** (default: Phase 3). Or pick & mix — happy to bundle Phases 3 + 4 in one push since they share the realtime/notification plumbing.
