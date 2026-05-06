# Phase 5.4 — Community Reviewer Tier & Disputes

## Goal
Phase 5.3 closed the AI verification loop but kept admins as the only fallback for `escalated` verdicts and appeals. At marketplace scale that doesn't hold. Phase 5.4 introduces a **trusted community reviewer tier** — vetted talent who earn credits to resolve escalations, two-sided disputes between poster and talent, and a transparent reputation layer that feeds back into trust + matchmaker.

This is the human layer that makes 5.3's automation safe to scale, and the reputation layer that makes 5.2's matchmaker fair.

---

## Part A — Cleanup carried over from 5.1 → 5.3

Six small gaps surfaced during 5.1–5.3 that 5.4 either depends on or should close in the same pass:

1. **`ai-content-originality`** — listed in 5.3 plan but not deployed. Needed before reviewers can adjudicate "AI-generated" risk flags meaningfully. Ship as a real edge function (heuristic n-gram + Gemini classifier).
2. **`ai-deliverable-fetch`** — same status. Without it, both verifier and reviewer see URLs not content for figma/github/gdrive submissions.
3. **`gig_bid_events` analytics surface** — table was created in 5.2 cleanup but admin Matchmaker subtab never wired the coach-acceptance chart. Quick win.
4. **`talent_trust_score` decay job** — recompute trigger exists, but the 90-day decay only applies on new event insert. Add a `cron-trust-decay` (daily) so dormant talent decay correctly even with no new events.
5. **Poster-side verification "Override → Reject" telemetry** — clicks are logged but no aggregation for the Verifier Insights chart (false-positive rate). Backfill the rollup view.
6. **Marketplace gig detail** — verdict chips render for poster, but talent's own submission card on `/app/gigs/mine` (or equivalent) still shows the legacy status, not the 5.3 verdict. Unify.

These ride on the 5.4 migration to avoid a separate cleanup release.

---

## Part B — Phase 5.4 — Reviewer Tier & Disputes

### Core concepts

- **Reviewer** = a talent who has opted in, passed a calibration test, and maintains a quality score. Earns credits per resolved item.
- **Escalation pool** = items 5.3 marked `escalated` are first offered to qualified reviewers (3 reviewers per item, majority verdict). Admin only sees items where reviewers disagree or no reviewer claims within SLA.
- **Dispute** = either party (poster or talent) can open a dispute on a completed/rejected gig within 7 days. Disputes always go through reviewer panel → admin appeal as last resort.
- **Reputation** = reviewer accuracy is measured against the eventual settled verdict; bad reviewers lose tier; good reviewers earn higher per-item credits and unlock dispute-tier items.

### Schema

| Object | Purpose |
|---|---|
| `reviewer_profiles` | `talent_id`, `tier` (`apprentice` / `reviewer` / `senior` / `master`), `categories text[]`, `status` (`active` / `paused` / `suspended`), `accuracy numeric`, `items_resolved`, `joined_at`, `last_active_at` |
| `reviewer_calibration_attempts` | Onboarding test results: `talent_id`, `score`, `passed`, `answers jsonb`, `attempted_at`. 3-attempt cap / 30 days. |
| `review_assignments` | One row per (item, reviewer). `kind` (`escalation` / `dispute`), `source_id` (verification_id or dispute_id), `status` (`offered` / `claimed` / `submitted` / `expired` / `recused`), `claimed_at`, `due_at`, `verdict`, `verdict_payload jsonb`, `confidence numeric`, `time_spent_s` |
| `gig_disputes` | `gig_id`, `submission_id`, `opened_by` (`poster` / `talent`), `reason_code`, `narrative`, `evidence jsonb`, `status` (`open` / `panel` / `admin` / `resolved` / `withdrawn`), `final_verdict`, `resolved_by`, `resolved_at` |
| `reviewer_credit_ledger` | `talent_id`, `assignment_id`, `delta numeric(12,1)`, `reason`, `paid_at` — flows through existing fractional credits wallet (per `mem://business/fractional-per-response-credit-model`) |
| `reviewer_reputation_events` | append-only: `talent_id`, `event` (`assignment_correct` / `assignment_incorrect` / `assignment_expired` / `recused` / `tier_promoted` / `tier_demoted`), `weight`, `assignment_id` |

RLS: reviewer sees only their own assignments + own ledger; parties to a dispute see only their dispute; admin full. Reviewer identities are anonymized to disputants ("Reviewer A/B/C").

### RPCs

- `apply_for_reviewer(_categories text[])` — opens calibration attempt; idempotent.
- `submit_calibration_attempt(_payload jsonb)` — scores, promotes to `apprentice` if pass.
- `claim_review_assignment(_assignment_id uuid)` — atomic claim; rejects if already claimed/expired or reviewer is party to gig.
- `submit_review_verdict(_assignment_id uuid, _verdict text, _payload jsonb, _confidence numeric)` — writes verdict; if 3 verdicts in → calls `settle_review_panel`.
- `settle_review_panel(_source_id uuid, _kind text)` — majority logic; ties → admin queue; writes settled verdict, fires `apply_verification_verdict` (5.3) or `resolve_dispute`.
- `open_gig_dispute(_submission_id uuid, _reason_code text, _narrative text, _evidence jsonb)` — either party; routes to reviewer panel.
- `resolve_dispute(_dispute_id uuid, _verdict text, _notes text)` — invoked by panel settlement or admin override.
- `recompute_reviewer_reputation(_talent_id uuid)` — invoked on every settlement; updates accuracy, triggers tier change if thresholds crossed.

### Edge functions

- `ai-reviewer-brief` — pre-digests an escalated item for a claiming reviewer: gig brief, acceptance criteria, AI verdict + rationale, prior submissions/revisions, surfaced risk flags. Cuts review time. (Gemini 2.5-flash.)
- `ai-dispute-summarizer` — same idea but two-sided: synthesizes both narratives + evidence into a neutral fact sheet for the panel.
- `ai-reviewer-quality-check` — periodic spot-check that re-scores a random 5% of reviewer verdicts with the verifier model; flags consistent disagreement → reputation event.
- `cron-review-assignment-sweeper` (every 2 min) — picks up new escalations + disputes → offers to top-N matched reviewers (by tier + category + load) using a small fan-out.
- `cron-review-assignment-expiry` (every 10 min) — `offered` past TTL → re-offer; `claimed` past `due_at` → expire + reputation hit.
- `cron-reviewer-payouts` (daily) — settles `reviewer_credit_ledger` into wallet; emits statement.
- `notify-review-assignment` — single rail for offer/claim-confirmed/verdict-due-soon/settled (in-app + native email queue).
- `notify-dispute-update` — for both parties.

### Reviewer cockpit (`/app/reviewer`)

- **Dashboard** — current tier, accuracy, items-this-week, credits earned, eligibility.
- **Inbox** — `Offered` / `Claimed` / `History`. Each row: gig title (anonymized poster), kind, payout, time-left.
- **Adjudication view** — ai-reviewer-brief panel + criteria checklist (✓/✗/partial) + risk-flag toggles + verdict + confidence slider + free-text rationale. Mandatory recuse button if conflict-of-interest.
- **Reputation panel** — last 20 settlements (Correct / Incorrect / Tied), trend, tier requirements.
- **Calibration & onboarding** — 5–10 sample items + rubric tutorial; instant scoring.

### Talent (disputant) surfaces

- On `auto_revise` / `human_rejected` / `escalated` verdict: **"Open dispute"** CTA visible for 7 days.
- `/app/gigs/disputes` — own disputes, status, reviewer panel progress (anonymized), final verdict.
- Dispute composer — reason code dropdown, narrative, evidence upload (reuses `gig-submissions` storage with signed URLs).

### Poster surfaces

- On `auto_approved` / `human_approved`: same "Open dispute" CTA for 7 days post-approval.
- On gig detail: dispute chip + panel status.
- "Disputes" subtab on `/app/employer/gigs/:id`.

### Admin surfaces

- **Gig Ops → Reviewer Program** (new subtab):
  - Applications & calibration queue
  - Active reviewers table (tier, accuracy, items, last active, suspend/promote/demote)
  - Calibration item bank editor
  - Reviewer payout statements
- **Gig Ops → Disputes**: open / panel / admin queues, ai-dispute-summarizer surfaced, override + final-verdict actions.
- **Gig Ops → Verification Queue** (existing from 5.3): now shows reviewer-panel status inline; admin only sees items where panel deadlocked or no reviewers available within SLA.
- **Reviewer Insights**: program health — supply/demand per category, median time-to-resolve, panel agreement rate, AI-vs-panel agreement rate, cost per resolved item.

### Trust + matchmaker wiring

- `talent_trust_events` (5.3) gains new event types: `dispute_won`, `dispute_lost`, `reviewer_correct`, `reviewer_incorrect`. Weights tunable in `verification_rules`.
- Matchmaker (5.2) automatically picks up changes via `talent_trust_score`. No code change in matchmaker.
- Reviewers' reputation does **not** influence their own talent trust score — kept separate to prevent feedback loops.

### Notifications

Templates (native email queue): `reviewer_application_received`, `reviewer_calibration_passed`, `reviewer_calibration_failed`, `review_assignment_offered`, `review_assignment_claim_confirmed`, `review_assignment_due_soon`, `review_assignment_settled`, `dispute_opened`, `dispute_panel_assembled`, `dispute_resolved`, `reviewer_tier_promoted`, `reviewer_tier_demoted`, `reviewer_payout_statement`.

### Cross-cutting

- Memory entry: `mem://product/community-reviewer-and-disputes` — tiers, thresholds, payout rates, panel rules, dispute window, anonymity rules.
- Reuses fractional credit wallet, native email queue, signed-URL storage, existing `auto-review-gig-submission` extension point.
- All reviewer earnings flow through the same earnings/payout pipeline as instructor payouts (`mem://product/instructor-monetization-payouts`) — minimum payout threshold reuses 500cr.

---

## Technical sequencing (Phase 4 SOP)

```text
Step 1 → Cleanup migration: ai-content-originality + ai-deliverable-fetch deployed,
         gig_bid_events analytics view, cron-trust-decay, verifier-override rollup,
         talent submission card unification
Step 2 → 5.4 schema migration: reviewer_profiles, reviewer_calibration_attempts,
         review_assignments, gig_disputes, reviewer_credit_ledger,
         reviewer_reputation_events + RLS + triggers
Step 3 → RPCs: apply_for_reviewer, submit_calibration_attempt, claim_review_assignment,
         submit_review_verdict, settle_review_panel, open_gig_dispute,
         resolve_dispute, recompute_reviewer_reputation
Step 4 → Edge functions: ai-reviewer-brief, ai-dispute-summarizer,
         ai-reviewer-quality-check, cron-review-assignment-sweeper,
         cron-review-assignment-expiry, cron-reviewer-payouts,
         notify-review-assignment, notify-dispute-update
Step 5 → Reviewer cockpit (/app/reviewer): dashboard, inbox, adjudication, reputation, calibration
Step 6 → Disputant UI: open-dispute CTA on verdicts, /app/gigs/disputes, composer
Step 7 → Poster UI: dispute chip + Disputes subtab on employer gig page
Step 8 → Admin UI: Gig Ops → Reviewer Program + Disputes + Reviewer Insights;
         extend Verification Queue with panel status
Step 9 → Memory entry + Phase 5.4 checkpoint in .lovable/plan.md
```

---

## Out of scope (later phases)

- B2B managed projects (5.5) — disputes there will have an SLA layer on top of this
- Public reviewer profiles / leaderboards (5.6 ideas)
- Payout & escrow release (5.7) — disputes still flip status only here
- Public `/gigs` SEO + reviewer transparency page (5.8)

---

## Open questions

1. **Panel size** — 3 reviewers majority, OR 2-of-2 with admin tiebreak? (Default proposal: 3.)
2. **Dispute window** — 7 days post-verdict for both sides. OK, or 5/10?
3. **Reviewer payout rate** — flat per-item by tier (e.g. 5cr / 10cr / 20cr / 40cr) OR % of gig value (e.g. 2%)? (Default: flat by tier — predictable for reviewer, decoupled from gig price gaming.)
4. **Anonymity** — reviewers fully anonymized to disputants; disputants identifiable to reviewers (needed to judge prior work/context). OK?
5. **Calibration cadence** — re-calibrate every 90 days OR only on accuracy drop below threshold? (Default: only on drop, plus quarterly random spot-check via `ai-reviewer-quality-check`.)
6. **Conflict of interest** — auto-block reviewer if same company/poster/category-recent-collab, OR rely on manual recuse? (Default: auto-block + manual recuse fallback.)

---

## Phase 5.4 — SHIPPED ✅
- Schema: reviewer_profiles, reviewer_calibration_attempts, gig_review_assignments, gig_disputes, reviewer_credit_ledger, reviewer_reputation_events
- Triggers: tg_reviewer_rep_recompute (auto-promotes tier on accuracy)
- RPCs: apply_for_reviewer, submit_calibration_attempt, claim_review_assignment, submit_review_verdict, settle_review_panel, open_gig_dispute, resolve_dispute
- Edges: ai-reviewer-brief, ai-dispute-summarizer, ai-reviewer-quality-check, cron-review-assignment-sweeper (2m), cron-review-assignment-expiry (10m), cron-trust-decay (daily), cron-reviewer-payouts (daily), notify-review-assignment, notify-dispute-update
- Cleanup edges from 5.1-5.3: ai-content-originality, ai-deliverable-fetch, gig_verifier_override_rollup view, recompute_all_trust_scores
- UI: /app/reviewer (cockpit), /app/gigs/disputes, OpenDisputeButton, admin Gig Ops → Reviewer Program tab
- Memory: mem://product/community-reviewer-and-disputes
