# Phase 5.5 — Managed Projects, Milestones & Escrow

## Goal
Phases 5.1–5.4 turned the gig marketplace into a self-driving system for **discrete, single-deliverable** work: a poster scopes one ask, the matchmaker recommends bidders, the verifier + reviewers settle outcomes, disputes resolve fairly. That model breaks the moment a Gro10x company posts a real B2B engagement — a website rebuild, a 4-week ops sprint, a content campaign — which is **multi-deliverable, milestone-paid, often multi-talent**, and needs funds held in escrow rather than paid per submission.

Phase 5.5 introduces the **Managed Project** primitive on top of the existing gig stack: a parent project that owns one or more milestones (each effectively a 5.1-style gig), with credit escrow, a project room, optional team composition, and a Gro10x-side cockpit that mirrors the talent cockpit. It plugs directly into the verification (5.3), reviewer (5.4) and matchmaker (5.2) layers — those already know how to settle a "gig"; a milestone is just a gig with a parent.

This is the layer that lets companies actually spend serious credits on the platform instead of treating it as a freelancer bench.

---

## Part A — Cleanup carried over from 5.1 → 5.4

Five small follow-ups surfaced while shipping 5.4 that 5.5 should close in the same migration:

1. **Reviewer calibration item bank** — schema exists, admin editor in `ReviewerProgramTab` is stubbed. Wire CRUD + preview-as-reviewer.
2. **Reviewer Insights chart** — `cron-reviewer-payouts` writes ledger rows but the program-health surface (supply/demand per category, panel-agreement rate, AI-vs-panel agreement) is not yet rendered. Add `get_reviewer_program_health` RPC + chart.
3. **Dispute SLA reminders** — `notify-dispute-update` fires on state change; missing the "panel claim deadline approaching" + "verdict due soon" pings. Extend `cron-review-assignment-expiry` to emit these.
4. **`gig_submissions_unified_view`** (5.3) — verifier reads it but talent-side `MyGigs` still hits the two underlying tables separately. Unify.
5. **Trust event weight tuning surface** — `verification_rules` row exists, no admin UI. Tiny form in Gig Ops → Verification.

These ride on the 5.5 migration to avoid a separate cleanup release.

---

## Part B — Phase 5.5 — Managed Projects

### Core concepts

- **Project** = a parent container owned by a company (or admin on a company's behalf). Has a budget in credits, currency display, timeline, scope doc, and 1..N milestones.
- **Milestone** = effectively a Phase 5.1 gig with `parent_project_id` set. Inherits 5.2 matchmaker, 5.3 verification, 5.4 reviewer/dispute behavior. Has its own escrow slice.
- **Escrow** = credits debited from the company wallet at project funding time, held in a dedicated escrow ledger, and released to talent only when a milestone is settled `approved` (auto or panel). Refunds on cancellation follow rules.
- **Project Room** = single thread per project, scoped to company members + assigned talents + admin. Reuses `application_messages` infra.
- **Team mode** = a milestone may have multiple awarded talents with credit splits (e.g. designer 60 / writer 40). The verification verdict applies to the milestone as a whole; splits apply on release.

### Schema

| Object | Purpose |
|---|---|
| `gig_projects` | `company_id`, `created_by`, `title`, `summary`, `category`, `budget_credits numeric(12,1)`, `currency_display`, `status` (`draft` / `funded` / `active` / `completed` / `cancelled` / `disputed`), `starts_at`, `due_at`, `scope_doc jsonb`, `visibility` (`private` / `invite` / `public`) |
| `gig_project_milestones` | `project_id`, `gig_id` (nullable until published), `seq int`, `title`, `summary`, `acceptance_criteria jsonb`, `budget_credits`, `due_at`, `status` (`draft` / `open` / `in_progress` / `submitted` / `approved` / `revising` / `rejected` / `cancelled`) |
| `gig_project_assignments` | `milestone_id`, `talent_id`, `role`, `split_pct numeric(5,2)`, `status` (`invited` / `accepted` / `declined` / `removed`), `accepted_at` |
| `gig_escrow_accounts` | `project_id`, `balance_credits numeric(12,1)`, `held_credits`, `released_credits`, `refunded_credits` |
| `gig_escrow_ledger` | `project_id`, `milestone_id`, `talent_id` (nullable), `delta numeric(12,1)`, `kind` (`fund` / `hold` / `release` / `refund` / `adjustment`), `reason`, `actor_id`, `tx_ref` |
| `gig_project_messages` | reuses `application_messages` shape but scoped by `project_id` |
| `gig_project_invitations` | `project_id`, `talent_id`, `invited_by`, `note`, `status` (`pending` / `accepted` / `declined` / `expired`) |

RLS: company members see only their company's projects; assigned talents see only milestones they're on + project room; admin full. Escrow ledger is select-only for company; admin can adjust with audit.

### RPCs

- `create_gig_project(_payload jsonb)` — draft creation; validates budget ≤ company wallet.
- `add_project_milestone(_project_id uuid, _payload jsonb)` — appends milestone to draft.
- `fund_gig_project(_project_id uuid)` — atomic: debits company wallet, credits `gig_escrow_accounts.balance_credits`, writes `fund` ledger row, flips project → `funded`.
- `publish_milestone(_milestone_id uuid)` — creates underlying `gig` row (kind = `marketplace` or `quick` per choice), holds milestone budget, opens to matchmaker. Reuses 5.1 `gig_briefs` pipeline if scoper assistance is requested.
- `award_milestone(_milestone_id uuid, _assignments jsonb)` — accepts winning bidder(s), writes `gig_project_assignments`, hold remains, flips milestone → `in_progress`.
- `submit_milestone_deliverables(_milestone_id uuid, _payload jsonb)` — talent submission; routes through `auto-review-gig-submission` (5.3); on approve → `release_milestone_funds`.
- `release_milestone_funds(_milestone_id uuid)` — reads `gig_project_assignments.split_pct`, credits each talent's wallet, writes `release` ledger rows, marks milestone `approved`, recomputes project status.
- `request_milestone_revision(_milestone_id uuid, _notes text)` — wraps 5.3 revision_requests, no escrow movement.
- `cancel_milestone(_milestone_id uuid, _reason text)` — refund hold to project balance per cancellation rules (full if not started, partial after work begun, none after submission unless dispute won).
- `cancel_gig_project(_project_id uuid, _reason text)` — bulk cancel all open milestones; refund unspent balance.
- `open_project_dispute(_milestone_id uuid, _reason_code text, _narrative text, _evidence jsonb)` — wraps 5.4 `open_gig_dispute`; outcome reflected in ledger (release vs refund vs split).
- `get_company_project_pipeline(_company_id uuid)` — returns project + milestones + escrow snapshot for the cockpit.
- `get_talent_project_workload(_talent_id uuid)` — for talent cockpit.

### Edge functions

- `ai-project-scoper` — extends `ai-gig-scoper` (5.1) to recommend a milestone breakdown from a single B2B brief: returns 2–6 milestones with titles, acceptance criteria, suggested credits, suggested team roles. Gemini 2.5-pro for structure quality.
- `ai-project-team-recommender` — for awarded milestones with multiple roles, proposes a multi-talent team and split percentages, leveraging `gig_matches` (5.2) per role.
- `ai-project-status-summary` — daily/weekly project digest for the company: progress, blockers, upcoming due dates, escrow position. Plain-English email body.
- `ai-milestone-acceptance-coach` — for talents joining a milestone, surfaces the acceptance criteria + linked AI brief (reuses `ai-reviewer-brief` shape) so they understand what "done" looks like before they start.
- `cron-project-status-sweep` (every 15 min) — flips milestone/project statuses based on escrow/submission/verdict state; emits `notify-project-update`.
- `cron-project-due-date-sweep` (daily) — at-risk + overdue detection; emits company + talent reminders.
- `cron-escrow-reconciliation` (daily) — invariant check: `balance = funded - released - refunded - held`; alerts admin on drift.
- `notify-project-update` — single rail: funded, milestone published, awarded, submitted, approved, revision requested, cancelled, disputed.
- `notify-escrow-event` — fund/release/refund receipts to company; payout receipts to talents.

### Talent surfaces

- **`/app/projects`** — "My projects" list: per-milestone status, next action, escrow-pending, due dates.
- **`/app/projects/:projectId`** — project room (chat), milestones I'm on, deliverable upload, dispute CTA (reuses 5.4 `OpenDisputeButton`), verdict cards (reuses 5.3 `VerificationVerdictCard`), payout chip per milestone.
- **Invitations** — `gig_project_invitations` surfaced in existing `JobInvitations`-style hook; accept/decline with note.
- **Earnings** — milestone payouts feed the existing earnings/wallet view; new "from project" tag.

### Company surfaces (Gro10x)

- **`/gro10x/work/projects`** — pipeline: Drafts / Funded / Active / Completed / Disputed.
- **`/gro10x/work/projects/:id`** — project cockpit:
  - Summary header: budget, escrow balance, % released, due, status
  - Milestones board (Kanban: Draft → Open → In Progress → Submitted → Approved/Revising)
  - Per-milestone panel: acceptance criteria, awarded talents + splits, submission viewer, verification verdict, dispute status
  - Project room (chat)
  - Escrow ledger view + receipts download
  - Activity timeline
- **New project wizard** (`/gro10x/work/projects/new`): brief → `ai-project-scoper` proposal → editable milestones → choose visibility (private invite vs open marketplace) → fund (debits wallet via `fund_gig_project`).
- **Invite talents** — direct invitation pulled from existing CRM (`talent_lists`, `talent_relationships`).

### Admin surfaces

- **Gig Ops → Managed Projects** (new subtab):
  - Pipeline across all companies (filterable)
  - Escrow position per project + cross-platform aggregate
  - Disputed/at-risk queue
  - Override actions: force release, force refund, adjust escrow (audited), reassign milestone
- **Gig Ops → Escrow Reconciliation**: daily reconciliation report, drift alerts, manual adjustments with audit log.
- **Project Insights**: median time-to-fund, time-to-award, time-to-approve per category; revision rate; dispute rate; average team size; cost per milestone.

### Wiring into existing systems

- **5.1 Scoper** → `ai-project-scoper` extends, doesn't replace; single-gig path unchanged.
- **5.2 Matchmaker** → each published milestone is a gig with a `parent_project_id`; matchmaker treats it identically. New filter: company members can prefer talents already on other accepted milestones for cohesion.
- **5.3 Verification** → milestone submissions flow through `auto-review-gig-submission` unchanged; verdict triggers escrow movement instead of direct payout.
- **5.4 Reviewer + Disputes** → milestone escalations and disputes use the existing reviewer panel; resolution writes to the escrow ledger via the same RPCs.
- **Trust + reputation** → milestone outcomes feed `talent_trust_events` exactly like standalone gigs; no double counting.
- **Credits wallet** → all movements stay inside the existing fractional wallet (per `mem://business/fractional-per-response-credit-model`); escrow is a typed bucket, not a parallel system.

### Memory

- New entry: `mem://product/managed-projects-and-escrow` — project model, escrow rules, cancellation/refund table, team-split rules, release triggers, anonymity & visibility rules, admin override audit policy.

### Out of scope (future phases)

- **5.6** — Public discovery for projects (`/projects` SEO) and project-level leaderboards.
- **5.7** — Cash payouts for talents (managed payments rails) once volume justifies.
- **5.8** — Cross-project portfolio surfaces and case-study generator from completed projects.

---

## Technical sequencing (Phase 4 SOP)

```text
Step 1 → Cleanup migration: reviewer item-bank CRUD, reviewer program health RPC,
         dispute SLA reminders, gig_submissions_unified_view consumer fixes,
         trust-event weight admin form.

Step 2 → Phase 5.5 schema: gig_projects, gig_project_milestones,
         gig_project_assignments, gig_escrow_accounts, gig_escrow_ledger,
         gig_project_messages, gig_project_invitations + RLS + triggers.

Step 3 → RPCs: create/add/fund/publish/award/submit/release/refund/cancel
         + dispute wrapper + pipeline/workload reads.

Step 4 → Edge functions: ai-project-scoper, ai-project-team-recommender,
         ai-project-status-summary, ai-milestone-acceptance-coach,
         cron-project-status-sweep, cron-project-due-date-sweep,
         cron-escrow-reconciliation, notify-project-update, notify-escrow-event.

Step 5 → Talent UI: /app/projects list, /app/projects/:id room, invitations,
         deliverable submit hooked to 5.3 verifier, dispute via 5.4 panel.

Step 6 → Gro10x UI: /gro10x/work/projects pipeline, project cockpit,
         new project wizard (scoper → fund), invite-from-CRM.

Step 7 → Admin UI: Gig Ops → Managed Projects subtab, Escrow Reconciliation,
         Project Insights.

Step 8 → Memory entry + plan.md update + smoke test:
         draft → fund → publish milestone → award → submit → approve → release.
```

## Open questions

1. **Escrow funding source** — credits-only at launch, or also accept managed payments (Stripe) directly into escrow when a company tops up specifically for a project?
2. **Cancellation refund schedule** — proposed: 100% before award, 50% after award before submission, 0% after submission unless dispute won. Confirm.
3. **Team splits** — fixed at award time, or editable mid-milestone with mutual consent? Default proposal: fixed; admin override only.
4. **Project visibility** — should `public` projects show up in the existing `/app/gigs` marketplace listing or in a separate `/app/projects` discovery surface? Default proposal: separate surface to avoid muddling single-gig matchmaker UX.
