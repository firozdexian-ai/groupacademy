# Phase 7 — Implemented ✅

- Comment tips (90/10 split) via `tip_comment` RPC, `post_comments` + `comment_tips` tables, inline UI in PostCard.
- Hype streaks: `current_streak`, `longest_streak`, `last_post_date` on talents; trigger on feed_posts; badges 7/30/100.
- Weekly leaderboard: `v_weekly_leaderboard` view, `leaderboard_payouts` table, `award-weekly-leaderboard` edge function (cron Mon 00:05 UTC), sidebar widget.
- Connection referrals: `referred_by` on talents, signup captures `?ref=`, trigger awards 10cr on first accepted connection, `ReferralCard` on Wallet.

## Next: Phase 8 candidates
- Creator subscriptions (recurring monthly hype)
- Live audio rooms
- Brand-sponsored challenges
- Admin: streaks leaderboard + payout history table
