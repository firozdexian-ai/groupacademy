# Phase 5.3 — AI Verification Automation & Trust Engine

## Goal
Remove humans from the gig submission → approval loop wherever safely possible. Every gig submission is auto-evaluated against its `acceptance_criteria` (set in 5.1), scored, and routed: auto-approve, auto-revise (request fix), or escalate to a human reviewer. Talent trust score becomes a real signal (already seeded in 5.2).

This closes the loop opened by 5.1 (scoper → criteria) and 5.2 (matchmaker → bid) so the marketplace can run end-to-end without admin babysitting.

## Part A — 5.2 cleanup (close before opening 5.3)

Three small gaps from 5.2 that 5.3 depends on:

1. **`notify-gig-match` edge function** — referenced in 5.2 plan but not deployed. Single transactional email + in-app notif for hot matches (score ≥ 0.85). 5.3 reuses the same notif rail for verification outcomes.
2. **Bid-coach acceptance telemetry** — `marketplace_bids.coached_version_id` exists but no event log. Add `gig_bid_events` (bid_id, event, payload) so admin Matchmaker subtab can show real coach acceptance rate, and 5.3 can correlate coached bids ↔ verification pass-rate.
3. **`gig_submissions` parity across all three gig kinds** — quick gigs and content gigs currently submit through different tables. Add a thin `gig_submissions_unified_view` (mirrors `gigs_unified_view` from 5.1) so the verifier has one input surface.

## Part B — Phase 5.3 — Verification Automation

### Schema

| Object | Purpose |
|---|---|
| `gig_verifications` | One row per submission. Cols: `submission_id`, `gig_kind`, `verdict` (`auto_approved` / `auto_revise` / `escalated` / `human_approved` / `human_rejected`), `score numeric(5,2)`, `criteria_results jsonb` (per-criterion pass/fail/score + evidence), `risk_flags jsonb` (plagiarism, AI-generated, brand-safety, scope-mismatch, low-effort), `model`, `tokens_used`, `latency_ms`, `reviewed_by`, `reviewed_at`. |
| `gig_revision_requests` | Talent-facing revision asks. Cols: `verification_id`, `summary`, `required_changes jsonb`, `attempts_remaining`, `due_at`, `status`. Default 2 attempts before escalation. |
| `gig_verification_appeals` | Talent appeal flow. Cols: `verification_id`, `reason`, `evidence_links`, `status`, `resolved_by`. |
| `verification_rules` | Admin-tunable thresholds per gig kind/category: auto-approve floor (default 0.85), escalate floor (default 0.55), risk-flag overrides. |
| `talent_trust_events` | Append-only ledger feeding `talent_trust_score` (already exists from 5.2): `event` (`verification_pass`, `verification_fail`, `revision_accepted`, `appeal_won`, `dispute_lost`), `weight`, `gig_kind`. |

RLS: talent sees own verifications + revision requests + appeals; poster sees verification verdict + score + risk_flags (not raw rationale) for their gig; admin full.

### RPCs

- `request_gig_verification(_submission_id uuid)` — idempotent; enqueues if not already pending; returns verification_id.
- `apply_verification_verdict(_verification_id uuid)` — server-side application: flips submission status, releases or holds escrow, fires notifications, writes `talent_trust_events`, recomputes `talent_trust_score`.
- `submit_revision(_revision_id uuid, _payload jsonb)` — talent re-submits; decrements attempts; re-queues verifier.
- `open_verification_appeal(_verification_id uuid, _reason text, _evidence jsonb)` — talent appeal; routes to admin queue.
- `resolve_verification_appeal(_appeal_id uuid, _decision text, _notes text)` — admin only; overrides verdict, logs trust event.

### Edge functions

- `ai-gig-verifier` — the core. Input: `submission_id`. Pulls the gig + `acceptance_criteria` + submission artifacts (text, links, attachments via signed URLs from `gig-submissions` storage). Runs structured tool-call against Gemini (`google/gemini-2.5-pro` for primary; `google/gemini-3-flash-preview` for low-risk quick gigs) returning `{score, per_criterion[], risk_flags[], rationale, suggested_revisions[]}`. Writes `gig_verifications`, then calls `apply_verification_verdict`.
- `ai-content-originality` — sub-tool for content gigs: AI-generated detection + light plagiarism heuristic (n-gram overlap against prior submissions in same category). Called by verifier when `kind='content'`.
- `ai-deliverable-fetch` — fetches & summarizes external deliverables (figma/github/gdrive/url) before passing to verifier so the model sees content, not just URLs.
- `cron-verification-sweeper` — every 5 min: picks up new `gig_submissions` lacking a verification row → calls `ai-gig-verifier`. Caps concurrency.
- `cron-revision-expiry` — daily: revision requests past `due_at` → auto-fail + trust event.
- `notify-verification-outcome` — single channel for `auto_approved` / `auto_revise` / `escalated` / `appeal_resolved` notifications (in-app + native email queue).

### Talent surfaces

- **Submission detail (`/app/gig-submissions/:id` or in marketplace gig modal)** — verdict card with score, per-criterion checklist (✓/✗ + one-line reason), suggested revisions if `auto_revise`, "Submit revision" CTA, "Appeal" link.
- **Revision composer** — modal listing `required_changes`; talent uploads/edits → `submit_revision`.
- **Appeals page** (`/app/gigs/appeals`) — list of own appeals + status.
- **Trust score widget** on profile sidebar — current score, last 5 events, "How to improve" tooltip.

### Poster surfaces

- On gig detail (poster view): submission row shows `Auto-approved ✓ (0.91)` / `Revision requested (1/2)` / `Escalated to review` chips, with risk_flags badges. One-click **Override → Approve** or **Override → Reject** (logs as poster decision, weighs into trust separately).
- New "Verifications" tab on `/app/employer/gigs/:id` showing the funnel (submitted → verified → revised → approved → paid).

### Admin surfaces

- **Gig Ops → Verification Queue** (new subtab): filter by `escalated`, `appealed`, `low-confidence`, `risk-flagged`. Inline view of submission + AI rationale + per-criterion results. Buttons: Approve / Reject / Send back for revision / Resolve appeal. SLA timer per item.
- **Gig Ops → Verification Insights**: auto-approve rate per kind/category, false-positive rate (overrides ÷ auto-approves), avg latency, model cost per verdict, top failing criteria (feeds Scoper improvements).
- **Verification Rules editor**: adjust thresholds + risk-flag policies per gig kind without code changes.

### Trust score wiring

- `talent_trust_score` (already exists from 5.2) is now driven mainly by `talent_trust_events`. Recompute on every event insert via trigger; capped 0–100; decay older events 90+ days old at 0.5x weight.
- Matchmaker (5.2) automatically benefits — no code change needed there.

### Notifications

- Templates (native email queue): `gig_verification_approved`, `gig_verification_revision_requested`, `gig_verification_escalated`, `gig_verification_appeal_resolved`, `gig_poster_override_logged`. All include deep links + unsubscribe.

### Cross-cutting

- Memory entry: `mem://product/gig-verification-automation` — verdict states, thresholds, escalation rules, trust event weights, model selection per kind.
- No payout/escrow logic changes here — verdict only flips submission status; payout still lands in 5.7. But schema leaves room for `payout_released_at` so 5.7 plugs in cleanly.
- Reuses `auto-review-gig-submission` if present (`src/lib/gigAutoReview.ts`) — extend rather than duplicate.

## Technical sequencing (Phase 4 SOP)

```text
Step 1 → 5.2 cleanup migration: notify-gig-match edge, gig_bid_events, gig_submissions_unified_view
Step 2 → 5.3 schema migration: gig_verifications, gig_revision_requests, gig_verification_appeals,
         verification_rules, talent_trust_events + trigger to recompute trust + RLS
Step 3 → RPCs: request_gig_verification, apply_verification_verdict, submit_revision,
         open_verification_appeal, resolve_verification_appeal
Step 4 → Edge functions: ai-gig-verifier, ai-content-originality, ai-deliverable-fetch,
         cron-verification-sweeper (5min), cron-revision-expiry (daily),
         notify-verification-outcome
Step 5 → Talent UI: submission verdict card, revision composer, appeals page, trust widget
Step 6 → Poster UI: verdict chips + Verifications tab + override actions
Step 7 → Admin UI: Gig Ops → Verification Queue + Insights + Rules editor
Step 8 → Memory entry + Phase 5.3 checkpoint in .lovable/plan.md
```

## Out of scope (later phases)
- Reviewer tier / disputes (5.4) — appeals here are admin-resolved; community reviewers come in 5.4
- B2B managed projects (5.5)
- Payout & escrow release (5.7)
- Public `/gigs` SEO (5.8)

## Open questions

1. **Auto-approve floor** — default 0.85 OK, or stricter (0.90) at launch and loosen with data?
2. **Revision attempts** — default 2 before escalation. OK or 1?
3. **Poster override weight** — should a poster's manual reject after auto-approve count against talent trust, or only flag the verifier for tuning? (My recommendation: only flag the verifier; trust hits only on admin or appeal-lost outcomes.)
4. **Originality check on content gigs** — start with heuristic + AI-generated detector, or also wire an external plagiarism API later?
5. **Escalation SLA** — show admins a 24h SLA timer per escalated item, with auto-nudge after 18h. Acceptable?
