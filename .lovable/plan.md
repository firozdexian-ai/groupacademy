# Phase 7 — Advanced Gamification & Creator Loyalty

Build on the Hype + Connections economy with mechanics that reward consistency, deepen engagement on individual posts, and create weekly competition that drives daily returns.

## Goals
1. Give fans a second, lower-friction way to reward creators (comment tips).
2. Reward creators who post consistently (hype streaks).
3. Create weekly competition with real credit payouts (leaderboard).
4. Reward connectors who bring new talent into the network (referrals).

---

## 1. Comment Tips (90/10 split)

A "Tip" button on every comment. Fans spend **2 / 5 / 10 credits** in one tap; creator receives 90%, platform takes 10%. Reuses the same `wallet_ledger` flow as Hype.

- Table: `comment_tips` (id, comment_id, post_id, sender_talent_id, recipient_talent_id, amount, creator_share, platform_share, created_at)
- RPC: `tip_comment(p_comment_id, p_amount)` — atomic deduction, 90/10 split, ledger entries, notification to recipient
- UI: small `TipButton` on each comment row in `PostCard.tsx` with a popover for amount selection
- Aggregated tip count badge on comments with ≥3 tips

## 2. Hype Streaks

Daily streak counter for creators who publish at least one post per day. Visible on profile and directory cards.

- Column: `talents.current_streak int`, `talents.longest_streak int`, `talents.last_post_date date`
- Trigger on `posts` insert: increments if last_post_date = yesterday, resets if older, no-op if today
- Badge unlocks at **7, 30, 100** day streaks (extend `creator_badges` enum)
- UI: 🔥 chip on profile + tooltip showing longest streak

## 3. Weekly Leaderboard with Credit Payouts

Every Monday 00:00 UTC, top 10 hyped creators of the previous week receive bonus credits.

- View: `v_weekly_leaderboard` (already partially built via `v_top_hyped_posts_week`, extend to per-creator aggregation)
- Table: `leaderboard_payouts` (week_start, talent_id, rank, credits_awarded, paid_at)
- Edge function: `award-weekly-leaderboard` (scheduled via pg_cron weekly)
  - Payout schedule: Rank 1 → 500cr, 2 → 300, 3 → 200, 4–10 → 100 each
  - Credits land in `bonus_credits` bucket, fully withdrawable
- UI:
  - `WeeklyLeaderboardWidget.tsx` in feed sidebar (live current-week ranking)
  - "Last week's winners" section with crown icons
  - Notification + badge when user wins

## 4. Connection Referrals

Talents earn 10 credits when someone they invited makes their first paid connection.

- Column: `talents.referred_by uuid` (set during signup if `?ref=` param present)
- Trigger on `talent_connections` first acceptance per inviter: credit `referred_by` user 10 credits
- Profile share link includes `?ref=<talent_id>`
- "Invite & Earn" card on Wallet page showing referral link, count, and earnings

## 5. Admin Console additions (Creator Economy tab)

- Streaks leaderboard (top 20 active streaks)
- Weekly payout history table with manual "Re-run payout" button
- Tip volume KPI + top-tipped creators
- Referral graph KPI (signups via ref, conversions, payouts)

---

## Technical Section

**Migrations**
1. `comment_tips` table + `tip_comment` RPC + RLS
2. `talents` columns: `current_streak`, `longest_streak`, `last_post_date`, `referred_by`
3. Streak trigger on `posts`
4. Extend `creator_badges` types: `streak_7`, `streak_30`, `streak_100`, `weekly_winner`
5. `leaderboard_payouts` table + `v_weekly_leaderboard` view
6. Referral trigger on `talent_connections`
7. pg_cron job invoking `award-weekly-leaderboard` every Monday 00:05 UTC

**Edge Function**
- `award-weekly-leaderboard/index.ts` — service-role client, idempotent (skip if `leaderboard_payouts` row exists for week), inserts ledger entries + payout rows + notifications

**Frontend**
- `src/components/feed/TipButton.tsx`
- `src/components/feed/WeeklyLeaderboardWidget.tsx`
- `src/components/talents/StreakBadge.tsx`
- `src/components/wallet/ReferralCard.tsx`
- Updates to: `PostCard.tsx`, `TalentDirectory.tsx`, `TalentPublicProfile.tsx`, `Withdrawals.tsx`, `CreatorEconomyTab.tsx`
- Capture `?ref=` in `Auth.tsx` signup flow → store in `localStorage` → pass to profile insert

**Economics summary**
| Mechanic | User cost | Creator earns | Platform |
|---|---|---|---|
| Comment tip | 2/5/10 cr | 90% | 10% |
| Weekly leaderboard | — | 100–500 cr bonus | — (growth spend) |
| Referral | — | 10 cr per converted invite | — (growth spend) |
| Streak badges | — | Status only | — |

---

## Out of scope (Phase 8 candidates)
- Paid subscriptions to creators (monthly recurring hype)
- Live audio/video rooms
- Brand-sponsored challenges
