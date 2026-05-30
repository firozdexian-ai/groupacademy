# D2 — Work Hub (Jobs Side) Copy Audit

Following D1 (Gro10x shell — already clean), D2 audits the talent-facing **Work / Jobs hub** for jargon, internal terms, and unclear copy.

## Scope (talent-facing only, no admin)

**Jobs hub pages**
- `src/pages/app/JobsHub.tsx`
- `src/pages/app/MyApplications.tsx`
- `src/pages/app/AppJobApplication.tsx`
- `src/pages/app/AppApplicationDetail.tsx`
- `src/pages/app/AppOfferDecision.tsx`
- `src/pages/app/AppInterviewSchedule.tsx`
- `src/pages/PublicJobDetail.tsx`

**Jobs hub components**
- `src/domains/jobs/components/views/{Browse,Companies,Locations,Tools}View.tsx`
- `JobCard`, `JobsHubHeader`, `JobApplyCTA`, `WhyYouMatchPanel`, `VerifiedMatchBadge`, `ScoreMeJobPicker`, `RelatedJobs`, `AIJobInsights`, `ProfileCompletenessGate`, `JobPreferencesSheet`, `ExternalApplicationPrep`, `InfiniteJobsList`, `CompanyCard`, `CompanyDetailSheet`, `CountryCard`

## What to look for

1. **Internal jargon** — Ingress, Ledger, Telemetry, Registry, Vector, Signal (when used as a label), Pipeline, Verdict, Synchronize, Handshake, Node, Phase, Tier-N, Cohort (when user-facing), HUD, Yield, Throughput, Schema, Payload, Edge, RPC, Tokens.
2. **Internal feature names leaking into UI** — "Hiring Loop", "Sourced", "Trust Score", "Match RPC", "Score-job-match", "Signal-driven", terms from product memos that shouldn't appear to talent.
3. **Status pill copy** — application states (e.g. `awaiting_review`, `shortlisted_internal`) shown raw instead of friendly labels.
4. **Empty states & errors** — "No records", "Query failed", "Edge function returned…" — must read as plain English.
5. **CTA clarity** — buttons like "Run match", "Compute score", "Open pipeline" → plain verbs ("See why you match", "Apply", "View status").
6. **Tooltips & badge labels** — VerifiedMatchBadge, match% explainers.

## Approach

1. `rg` sweep across the scoped files for jargon keyword list above (case-insensitive).
2. Read each file with hits + the 4 view files end-to-end (they drive most UI).
3. For each finding, propose a plain-English replacement inline.
4. Apply edits as small, parallel `line_replace` calls. No logic/data changes — copy only.
5. Verify by re-running the jargon sweep; expect zero hits except false positives (type names, code identifiers).

## Out of scope

- Admin jobs UI (`src/domains/jobs/components/admin/**`) — covered in C-series.
- Backend / edge functions / RPC names.
- Visual redesign — copy & labels only.

## Deliverable

A single batch of edits + a short summary table: file → before → after.

Next phase after D2: **D3 — Learning hub (talent side)**.
