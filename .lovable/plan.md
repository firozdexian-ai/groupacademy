# Phase 4.7 — Instructor Monetization & Payouts

Closes the loop opened in 4.1: instructors already earn 60/40 splits on course briefs and 50 free AI credits on accepted offers, but there is no statement, no payout request flow built for instructors specifically, and no admin reconciliation. This phase makes "I taught — I got paid" a first-class workflow.

> Study Abroad is intentionally **not** in scope here — it gets its own Phase 4.8 (notes at the bottom).

---

## Goals

1. Every instructor sees a clear earnings dashboard: lifetime, this month, pending, paid.
2. Instructors can request a payout to bKash / bank / Wise / PayPal, reusing existing `talent_payout_accounts`.
3. Admin can review, approve, mark paid, and download a CSV statement.
4. Monthly statement PDF auto-generated and emailed (transactional, via existing `notify.groupacademy.online`).
5. Cohort + course-brief revenue flows into a single ledger so the math is auditable.

---

## 1. Earnings ledger (single source of truth)

New table `instructor_earnings_ledger`:
- `instructor_id`, `talent_id` (denormalised), `source_kind` (`course_revenue_split` | `cohort_session` | `bonus` | `adjustment`)
- `source_id` (FK-ish to `course_revenue_splits.id` / `course_sessions.id` / NULL)
- `amount_credits` numeric(12,1), `currency` always credits
- `period_month` date (first of month) for fast statement queries
- `status` `accrued` | `available` | `paid` | `void`
- `payout_request_id` nullable
- `created_at`, `updated_at`, audit columns

Backfill on migration:
- One row per existing `course_revenue_splits` row where `instructor_share > 0`, status `available`.
- One row per `course_sessions` with `instructor_id` and `status='completed'`, valued by the existing per-session rate.

Trigger: when `course_revenue_splits` is INSERTed, write a ledger row automatically.

## 2. Instructor earnings dashboard (`/app/instructor/earnings`)

New tab inside the existing `/app/instructor` shell.

- Hero: 4 stat cards — `Lifetime`, `This month`, `Available to withdraw`, `Pending payout`.
- Chart: 6-month bar chart by `period_month` (Recharts).
- Table: ledger with filters (period, source kind, status). CSV export.
- Side panel: payout method (reuse `talent_payout_accounts`), big "Request payout" button.

RPC: `get_instructor_earnings_summary(_instructor_id)` → totals + 6-month series + last 20 ledger rows. SECURITY DEFINER, search_path = public.

## 3. Payout request flow

New table `instructor_payout_requests` (mirrors `agent_payout_requests` shape):
- `instructor_id`, `talent_id`, `amount_credits`, `payout_method`, `payout_details jsonb`, `status` (`pending|approved|paid|rejected`), `admin_notes`, `processed_by`, `processed_at`.

Edge function `request-instructor-payout`:
- Validates: minimum 500 credits, `available` ledger balance ≥ amount, primary `talent_payout_accounts` exists.
- Creates request row, flips matching ledger rows from `available` → `pending` (locked via FK `payout_request_id`).
- Notifies admin via existing `notify.groupacademy.online` queue.

Approve/reject:
- Edge function `process-instructor-payout` (admin-only): on `approve` keep ledger pending; on `paid` flip ledger rows to `paid`; on `reject` flip back to `available` and clear FK.
- Audit trail in `payout_audit_log` (existing table; verify in implementation).

## 4. Monthly statement PDF + email

- `cron-instructor-monthly-statement` (1st of month, 03:00 UTC):
  - For each instructor with activity in the previous month, generate an HTML statement and PDF (use `pdf-lib`-style approach already used by certificates if present — otherwise render HTML and let recipient print; **decide in implementation**).
  - Insert into `instructor_statements` table (`period_month`, `pdf_url` in storage bucket `instructor-statements`, `summary jsonb`).
  - Email via the native transactional pipeline (templated subject "Your October 2026 earnings statement — Group Academy").

Storage bucket: private `instructor-statements`, signed-URL access only.

## 5. Admin reconciliation surface

In existing **Group #11 — Learn → Instructor Workspace** admin tab, add a 3-tab nested view:

| Tab | What it shows |
|---|---|
| **Earnings** | Aggregated ledger across all instructors, filters by month/instructor/course |
| **Payout Requests** | Inbox of pending requests, approve/mark-paid actions |
| **Statements** | Monthly PDFs, manual regenerate button |

Reuse `useTanStackTable` patterns already in admin.

## 6. Talent-side polish

- `/gro10x/billing` already shows "earned" credits — add a small "Instructor earnings" card if the user has an instructor role, deep-linking to `/app/instructor/earnings`.
- TalentSignalPanel (4.6) already shows "Active learner"; add a sibling chip "Active instructor" when `last_instructor_activity_at` < 30d.

---

## Technical details

### New / changed DB

| Object | Type | Purpose |
|---|---|---|
| `instructor_earnings_ledger` | table | Append-only ledger of accruals |
| `instructor_payout_requests` | table | Withdrawal workflow |
| `instructor_statements` | table | Monthly PDF metadata |
| `instructor-statements` | storage bucket | Private, signed URLs |
| `get_instructor_earnings_summary(uuid)` | RPC | Dashboard payload |
| `request_instructor_payout(uuid, numeric, uuid)` | RPC | Atomic ledger lock |
| `trg_split_to_ledger` | trigger | Auto-write on `course_revenue_splits` insert |

RLS:
- Ledger rows: instructor reads own (`talent_id` matches), admin reads all.
- Payout requests: instructor reads/inserts own; admin updates.
- Statements: instructor reads own, admin reads all, signed-URL only for the PDF.

### New / changed edge functions

- `request-instructor-payout` (new) — validates + creates request.
- `process-instructor-payout` (new) — admin approve/reject/mark-paid.
- `cron-instructor-monthly-statement` (new, scheduled 1st of month).
- `notify-instructor-payout-event` (new) — payout status emails to instructor.

### New / changed surfaces

- `src/pages/app/instructor/InstructorEarnings.tsx` (new tab page)
- `src/pages/app/instructor/InstructorEarningsLedgerTable.tsx`
- `src/pages/app/instructor/RequestPayoutSheet.tsx`
- `src/components/dashboard/admin/learn/InstructorPayoutsTab.tsx`
- Extend `Gro10xBilling` with the small "Instructor earnings" card.
- Extend `TalentSignalPanel` with `Active instructor` chip.

### Out of scope (deferred)

- Stripe Connect / international ACH — keep manual bKash/bank/Wise for now (matches existing `talent_payout_accounts` constraint).
- Currency conversion — everything stays in credits until the moment of actual payout (admin records the BDT/USD rate on `mark_paid`).
- Cohort co-instructor splits beyond the existing 60/40 — explicit follow-up.

---

## Recommended decisions (built-in unless you object)

1. **Minimum payout = 500 credits** (≈ 1,000 BDT). Aligned with existing earned-credit thresholds.
2. **Payout cycle = on-demand** (instructor initiated), not auto-monthly — gives instructors control and reduces failed-disbursement noise.
3. **Statements are informational, not gated** — sending the PDF doesn't trigger payment; it's a record.

---

## Open questions

1. Should we let instructors split earnings across multiple payout methods in one request (e.g. half bKash, half bank), or one method per request? Recommend **one method per request** for simplicity.
2. Should rejected payouts return ledger rows to `available` automatically (recommend yes), or require admin re-classification first?

---

## Quick note on Phase 4.8 — Study Abroad Closed Loop

Already-built primitives we'd build on in 4.8 (not this phase):
- Tables: `study_abroad_programs`, `study_abroad_roadmaps`, `ielts_resources`, `ielts_resource_access`.
- Pages: `/app/study-abroad`, `StudyAbroadDetail`, `StudyAbroadRoadmap`, `StudyAbroadRoadmapResults`.
- Admin: Group #13 "Career Abroad" tabs (programs, leads, IELTS, counsellor, outreach agents).

What's missing (4.8 scope, for later approval):
- Counsellor assignment + pipeline (mirroring employer pipeline in 4.5/4.6).
- Document checklist per program (transcripts, SOP, LORs, IELTS, financials) with talent uploads.
- Application timeline & status tracking per program.
- Counsellor payouts (reuse the ledger built in 4.7).
- "Active applicant" signal feeding TalentSignalPanel.
- AI agent for SOP draft + program shortlisting (Lovable AI, no extra keys).

If you'd like, after 4.7 ships we can plan 4.8 in detail.
