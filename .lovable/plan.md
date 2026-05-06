# Phase 5.2 — AI Matchmaker + Bid Coach (with 5.1 cleanup)

## Part A — Phase 5.1 cleanup (close before opening 5.2)

5.1 shipped `gig_briefs`, `gig_scope_drafts`, `ai-gig-scoper`, `acceptance_criteria`, `/app/gigs/new`, and the admin Gig Ops queue. Three loose ends remain that 5.2 depends on:

1. **`ai-gig-pricer` edge function** (was in 5.1 spec, not deployed). Suggests fair credit price using `gig_submissions` history + scope complexity. Used by both the wizard ("AI suggested 35cr — adjust?") and Matchmaker (price-fairness signal).
2. **Unified `gig_kind` enum + `acceptance_criteria` on `gigs` and `content_gigs`** — the column was added to `marketplace_gigs` only. Without parity, Matchmaker can't rank across all three sources.
3. **Unified `/app/gigs` v2 listing** — current Gigs.tsx still queries 3 tables separately. Add a `gigs_unified_view` (SQL view) over the three tables exposing `id`, `kind`, `title`, `skills`, `credits`, `deadline`, `status`, `acceptance_criteria` so Matchmaker, the public list, and the new push-notifications all use one source.

## Part B — Phase 5.2 — AI Matchmaker + Bid Coach

### Goal
Stop relying on talents finding gigs. Push qualified gigs to the right talent, coach their bid, and give the poster an AI-shortlisted bidder list.

### Schema

| Object | Purpose |
|---|---|
| `gig_matches` | One row per (gig_id, talent_id) candidate. Columns: `score numeric(5,2)`, `signals jsonb` (verified skills hit, CEFR, past quality, availability, price-fit), `status` (`offered` / `viewed` / `bid` / `won` / `dismissed` / `expired`), `offered_at`, `expires_at`. Unique (gig_id, talent_id). |
| `gig_bids` (extend or create if missing on unified table) | Add `coached_version_id`, `ai_rationale jsonb`, `proof_links jsonb`, `match_id` FK. |
| `talent_availability` | `weekly_capacity_hours`, `paused_until`, `categories[]`. Lightweight; defaults inferred from past activity. |
| `gig_match_digests` | Daily/weekly digest log per talent (for unsubscribe + dedup). |

RLS: talent sees own matches/bids; poster sees own gig's matches once `status >= 'bid'` (or always for the AI-recommended panel, anonymized until shortlisted); admin full.

### RPCs

- `match_talents_to_gig(_gig_id uuid, _limit int default 25)` — scoring across `talent_skill_profile`, verified credentials, CEFR, prior `gig_verifications` quality, `talent_trust_score`, `talent_availability`, language match, price-fit vs `talent_earnings_ledger` history. Returns ranked list, upserts `gig_matches`.
- `match_gigs_for_talent(_talent_id uuid, _limit int default 20)` — inverse, used by daily digest + `/app/gigs?tab=for-you`.
- `record_match_event(_match_id, _event)` — view/dismiss/bid telemetry.
- `shortlist_match(_match_id)` — poster action; flips status, notifies talent.

### Edge functions

- `ai-bid-coach` — input: `gig_id`, `draft_text`. Pulls scope, talent's verified skills + portfolio + past wins, returns improved bid, structured `rationale`, suggested `proof_links` (auto-pulled from public profile / completed tracks / certificates).
- `ai-match-explainer` — short "Why you?" string per match for the inbox card and the poster's recommended panel ("Verified React + 92% on past 4 frontend gigs + within budget").
- `cron-gig-matchmaker` — runs every 15 min on new/updated open gigs → calls `match_talents_to_gig` → emits notifications (cap N/talent/day to avoid spam).
- `cron-gig-digest` — daily 9am local-time digest per talent via the native email queue.
- `notify-gig-match` — single transactional email + in-app insert for hot matches (score ≥ 0.85).

### Talent surfaces

- `/app/gigs?tab=for-you` — new default tab. Cards show match score, Why-you chip, one-tap "Draft bid with AI". Empty state: profile-strengthening nudges (verify skills, add availability).
- Bid composer (modal on any gig detail): textarea + **"Improve with AI"** button → diff view + accept/reject. Stores both versions.
- Profile sidebar widget: weekly capacity slider + paused toggle (writes `talent_availability`).
- In-app inbox + email: "3 new matches" summary card.

### Company / poster surfaces

- On every gig detail (employer view): **AI-recommended bidders** panel (top 5, anonymized name + score + Why-you chip + verified-skill badges). One-tap **Shortlist** → reveals identity + sends notification.
- `/app/employer/gigs/:id` gets a Matches subtab with funnel (offered → viewed → bid → shortlisted → won).

### Admin surfaces

- Gig Ops → **Matchmaker** subtab: live funnel (offered/viewed/bid/won/completed) per kind, top mismatched gigs (low scores everywhere → scope or price issue → flag back to Scoper), bid-coach acceptance rate, digest open-rate.
- Trust signal: matches that bid but lose >5× consecutively → trust score nudge.

### Notifications

- Native email queue only (per memory: never B2B mailto for transactional).
- Templates: `gig_match_hot`, `gig_match_digest`, `gig_bid_shortlisted`, `gig_bid_lost`. All include unsubscribe + capacity-update deep links.

### Cross-cutting

- Memory entry: `mem://product/gig-matchmaker-and-bid-coach` capturing scoring weights, digest rules, anonymization rule, capacity defaults.
- Fractional credits unchanged. No payout changes (those land in 5.7).
- `talent_skill_profile` and `talent_trust_score` already exist from Phase 4 + 5.1 prep — extend signals only, no rename.

## Technical sequencing (matches Phase 4 SOP)

```text
Step 1 → 5.1 cleanup migration: ai-gig-pricer edge + acceptance_criteria parity + gigs_unified_view
Step 2 → 5.2 schema migration: gig_matches, talent_availability, bids extension, gig_match_digests + RLS
Step 3 → RPCs: match_talents_to_gig, match_gigs_for_talent, record_match_event, shortlist_match
Step 4 → Edge functions: ai-bid-coach, ai-match-explainer, cron-gig-matchmaker, cron-gig-digest, notify-gig-match
Step 5 → Talent UI: /app/gigs ForYou tab, bid composer "Improve with AI", availability widget
Step 6 → Poster UI: AI-recommended bidders panel + Matches subtab
Step 7 → Admin Matchmaker subtab under Gig Ops
Step 8 → Memory entry + Phase 5.2 checkpoint in .lovable/plan.md
```

## Out of scope (still later phases)
- Verification automation (5.3)
- Reviewer tier / disputes (5.4)
- B2B managed projects (5.5)
- Public `/gigs` SEO (5.8)

## Open questions

1. **Push channel** for hot matches — in-app + email only, or also SMS via the existing global phone capture?
2. **Anonymization** of bidders to posters — keep anonymous until shortlist (recommended for trust), or always reveal?
3. **Cap on matches/talent/day** — default to 5 hot pushes + 1 daily digest. OK?
4. **For-you tab** — make it the default landing tab on `/app/gigs`, or keep "Tasks" default and add a banner?
