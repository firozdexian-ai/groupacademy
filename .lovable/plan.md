# Gamification & Creator Economy — Hype Button + Talent Connections

Two new monetization layers that make GroUp Academy "fun to come back to" — turning the feed into a creator earnings engine, and turning every talent profile into a paid connection node (LinkedIn-meets-OnlyFans-meets-Cameo, but for careers).

---

## Feature 1 — Hype Button (Paid Reactions on Posts)

A new reaction on every feed/UGC post. Pressing **Hype** spends **1 credit** from the sender and credits the post author with a share. Counters are public — high-hype posts surface to the top.

### Economy
- Cost per hype: **1 credit** (= 0.5 BDT).
- Split: **80% creator → `earned_balance`**, **20% platform**.
- No daily cap, but rate-limit (max 50 hypes/post/user) to prevent self-pumping.
- Self-hype blocked. Hype on own post → toast "you can't hype yourself".
- Refundable window: **0** (instant settlement, no take-backs — keeps ledger clean).
- Public leaderboard: "Top Hyped This Week" on Feed sidebar + Creator badge at 500/1k/5k cumulative hypes.

### Where it lives
- New button in `src/hooks/usePostReactions.ts` reaction set, but routed through a **separate paid path** (not free reactions). Free reactions (like, insightful, celebrate, support) stay free.
- Post card shows: `🔥 234 Hype • +117 credits earned` (creator sees earnings; viewers see count only).
- Creator dashboard gets a **Hype Earnings** card under Wallet.

### Backend
- New table `post_hypes (id, post_id, sender_talent_id, credits_spent, creator_share, platform_share, created_at)`.
- Edge function `post-hype` (auth required): debits sender wallet (spend order: bonus → balance → earned), credits creator `earned_balance`, logs to `credits_ledger` with `source = 'hype_received' / 'hype_sent'`.
- `posts` table denormalized counter `hype_count` + trigger.
- Realtime subscription so counters animate live.

---

## Feature 2 — Talent-to-Talent Connections (Paid Inbox)

Right now talents can't message each other. We introduce a **paid connection request** model — same pattern as AI agent connect fees, but priced dynamically by the recipient's transaction history.

### The 5,000-credit Gate
- Messaging is **off by default** for every talent.
- A talent's inbox auto-unlocks once they hit **5,000 lifetime credit transactions** (sum of |earned| + |spent| + |purchased| + |received|).
- Or pay **5,000 credits one-time** to unlock immediately.
- Once unlocked, profile becomes **searchable** + Connect button appears.

### Dynamic Connection Pricing (1% Rule)
- Connection-request fee = **1% of the recipient's lifetime transaction volume**, floored at the gate.
- Example: 5,000 transacted → 50 credits to connect. 12,400 transacted → 124 credits. Big creators get expensive (scarcity = prestige).
- Recalculated nightly + on every ledger write.
- AI agents: **fixed 10 credits** to start, but auto-scales with their own transaction popularity, capped at e.g. 500 to keep top agents reachable.

### Connection Request Split
- 70% recipient `earned_balance` / 30% platform (slightly more platform-heavy than Hype since it's higher friction).
- Recipient must **accept** within 14 days or fee is **refunded** to sender.
- On accept → both can DM freely (or we layer per-message fees later — see Phase 2).

### Profile Visibility Tiers
| Tier | Trigger | What others see |
|---|---|---|
| Hidden | < 1k transactions | Name + avatar only on feed posts |
| Public | ≥ 1k OR has 1+ post | Full profile, no Connect button |
| Open | Inbox unlocked | Full profile + Connect button + price |

### Backend
- New tables: `talent_connections (sender_id, recipient_id, status, fee_paid, created_at, accepted_at)`, `talent_inbox_settings (talent_id, unlocked_at, unlock_method)`.
- View `v_talent_transaction_volume` aggregating ledger.
- Edge function `connection-request` handles fee debit, escrow, refund-on-expiry.
- New page `/app/talents/:id` (public profile) + `/app/talents/search`.
- Reuse existing `messaging_*` infrastructure from the agent inbox.

---

## Suggested Additional Gamification (for your review)

1. **Hype Streaks** — post + receive ≥10 hypes 5 days running → bonus 50 credits.
2. **Profile Boost** — spend 100 credits to pin your profile to the search results for 24h.
3. **Comment Tips** — same 1-credit micro-payment but on comments, 90/10 split (encourages quality replies).
4. **Weekly Creator Payout Leaderboard** — top 10 hyped creators get a 2x multiplier on next week's earnings.
5. **Referral-to-Connection** — if A introduces B to C (paid intro), A gets 10% of the connection fee.
6. **Verified Creator Badge** — auto-granted at 10k cumulative hypes received; unlocks higher payout split (85/15).

---

## Phasing

**Phase 1 (this build)**
- Hype button + ledger + creator earnings card.
- Connection gate + 1% dynamic pricing + request/accept flow + searchable profiles.

**Phase 2 (next)**
- Per-DM micro-fees on premium creators.
- Hype streaks + leaderboards.
- Profile boost.

---

## Technical Details

- New tables: `post_hypes`, `talent_connections`, `talent_inbox_settings`. Materialized view `v_talent_transaction_volume` refreshed via trigger on `credits_ledger`.
- New edge functions (all `verify_jwt = false` + in-code `auth.getUser` check): `post-hype`, `connection-request`, `connection-respond`, `talent-search`.
- Extends `credits_ledger.source` enum: `hype_sent`, `hype_received`, `connection_fee_sent`, `connection_fee_received`, `inbox_unlock`.
- RLS: hype rows readable by anyone (public counters), insert by sender only. Connections readable by sender+recipient only. Inbox settings: self-only.
- Wallet spend order preserved: `contact_bonus → balance → earned_balance`.
- All credit moves log to `credits_ledger` for audit + admin reporting.
- Frontend: extend `usePostReactions`, new `useHype`, `useTalentConnection`, `useTalentSearch` hooks. New `TalentProfilePublic.tsx`, `TalentSearch.tsx`, `ConnectionRequestDialog.tsx`.
- Admin: new tab under Talent group → "Creator Economy" with hype volume, connection revenue, top earners, abuse flags.
- Update `mem://business/fractional-per-response-credit-model` and add new memory `mem://product/creator-economy-hype-and-connections`.

---

**Questions before I build:**
1. Confirm splits: Hype **80/20**, Connection **70/30** — OK?
2. Inbox-unlock threshold: **5,000** transactions — OK or higher (e.g. 10k for scarcity)?
3. Self-hype: blocked entirely, or allowed but doesn't earn (vanity only)?
4. Should connection fees be **refundable on decline** or kept (anti-spam tax)?
5. Want me to ship Phase 1 in one go, or split Hype first → Connections second?
