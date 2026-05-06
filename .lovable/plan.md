# Phase 3.5 — Closing the Hiring Loop (Gro10x + Admin + Talent)

3.4 made the **talent-side** application a tracked pipeline. The other side of the loop is silent: the Gro10x employer portal already has `Gro10xJobsList` / `Gro10xJobApplicants` / `Gro10xShortlist` / `Gro10xInbox`, but they aren't wired into the new `application_status` model, status moves don't notify talent, and the public `/jobs/:id` page is still the old dense layout. 3.5 closes the loop end-to-end.

CRM (`Gro10xCRM`) and the marketing of company contacts are **out of scope** — they get their own phase.

---

## Scope

### A. Gro10x employer pipeline (primary employer surface)

Upgrade `Gro10xJobApplicants.tsx` and `Gro10xShortlist.tsx` into a single **kanban pipeline** per job:

```text
New → Reviewing → Shortlisted → Interview → Offer → Hired
                                               ↘ Rejected   ↘ Withdrawn
```

- Drag (desktop) or tap-to-move (mobile) between lanes → updates `application_status`. The 3.4 trigger already stamps `last_status_at` and (new in 3.5) fires the talent notification.
- Card: applicant name, headline, AI match score, applied X ago, CV download icon.
- Click → side sheet with: full profile snapshot, submitted CV/cover letter (signed URL), AI rationale, **Messages tab** (reuses Gro10xInbox thread for that application), internal notes (private to recruiters).
- Filters: by job, min match score, status, date range, has-assessment.
- Bulk actions: shortlist, reject with templated reason, export CSV.
- Mobile (≤md): kanban auto-collapses to a status-tab list — same card, same sheet.
- Lives at `/gro10x/work/jobs/:jobId/applicants` (replaces current `Gro10xJobApplicants`) and a roll-up `/gro10x/work/applications`.

### B. Admin oversight console (parallel /dashboard view)

Per the answer to "where does the pipeline live", build a parallel admin console at `/dashboard/admin/jobs/applications`:

- Same kanban + side sheet components as A — exposed across **all** companies (admin scope), not just one company's jobs.
- Adds an `Owner company` column/filter so platform admins can intervene on any pipeline.
- Read-write (admins can move cards) but every move is logged in `application_audit_log` with `actor_role='admin'`.
- Lives in the existing Admin → Jobs group (mem: Admin Groups 7-10).
- Component reuse: A and B import the same `<ApplicationKanban>`, `<ApplicationDetailSheet>`, `<ApplicationFilters>` — only the data scope and filter defaults differ.

### C. Status-change notifications (talent-facing)

Every status move triggers a notification to the talent:

| Status change         | Channel                  | Copy                                      |
|-----------------------|--------------------------|-------------------------------------------|
| → Viewed              | In-app feed only         | "Your application was viewed by {co}"     |
| → Shortlisted         | In-app + email           | "You're shortlisted for {role} at {co}"   |
| → Interview requested | In-app + email + push    | "Interview request from {co}"             |
| → Offer               | In-app + email + push    | "Offer from {co} — review by {date}"      |
| → Rejected            | In-app + email (gentle)  | "Update on your {role} application"       |
| → Hired               | In-app + email + push    | "🎉 You got hired at {co}"                 |

- In-app: reuses agentic feed notifications infra (mem: Agentic Feed Notifications).
- Email: reuses native queue at `notify.groupacademy.online` (mem: Native Email Flow + Email Strategy).
- New trigger `trg_job_application_status_notify` fires after the existing `last_status_at` stamp; trigger calls a new dispatcher edge `notify-application-status` which fans out per the matrix above.

### D. Recruiter ↔ candidate messaging via Gro10xInbox

Application threads become a new channel inside the existing inbox (one source of truth):

- New table `application_messages` (`application_id`, `sender_id`, `sender_role` enum [`talent`|`recruiter`|`admin`], `body`, `attachments jsonb`, `read_at`, `created_at`).
- **Recruiter view**: thread renders inside the Gro10x application side sheet AND surfaces in `Gro10xInbox` as an `Application: {Job} — {Candidate}` conversation.
- **Talent view**: thread renders inside `AppApplicationDetail` (3.4 page) as a Messages section; also lands in the talent's existing messenger (mem: Messenger Inbox) as a conversation pinned with the job context.
- Reuses existing `messaging-send` edge (just adds an `application_id` linkage so threads route to the right surface).
- Realtime via `supabase_realtime` on `application_messages`.
- Gating: respects the platform's existing inbox gating rules; **recruiters initiating a thread on their own posted role do not consume credits** (it's their pipeline) — talents initiating a thread to a recruiter still follows existing connection-fee rules (mem: Creator Economy).
- New messages trigger the in-app notification + a 15-min email digest (instant email only on the first message of a thread).

### E. Public job detail redesign (`/jobs/:id`)

The logged-out page is the SEO + share surface. Mirror the 3.4 mobile-first layout, **without** any tools that need credits:

- Same hero, meta pills, About / Requirements / Company sections, similar-roles rail.
- **No** match strip — replaced with a "Sign in to see your match" banner → routes to auth then back.
- Sticky bottom bar: "Apply" → auth gate → `/app/jobs/:id/apply`.
- Keeps existing JSON-LD `JobPosting` block (mem: SEO & Discovery).
- Public-safe RPC for similar roles (no personalization).

### F. Withdraw / re-open polish

3.4 added soft `withdrawn`. Now:
- 7-day undo window in `AppApplicationDetail` ("Restore application").
- Withdrawn cards show in a greyed Withdrawn lane in both A and B kanbans (so recruiters see ghosts and can ignore them cleanly).

---

## Backend

### Schema changes
- New table `application_messages` with RLS:
  - Talent: read/write rows where they own the parent `job_applications.user_id`.
  - Recruiter: read/write rows where the parent application's `job_id` belongs to a company they manage (uses existing company-membership check).
  - Admin: read/write all (uses `has_role(auth.uid(), 'admin')`).
- New table `application_audit_log` (`application_id`, `actor_id`, `actor_role`, `from_status`, `to_status`, `reason`, `created_at`).
- `job_applications` UPDATE RLS extended: recruiters of the owning company may change `application_status`, `recruiter_notes`, `assessment_status` (currently admin-only).

### Triggers / functions
- `trg_job_application_status_notify` — after-update on status change, calls `notify-application-status` and writes to `application_audit_log`.
- `notify-application-status` edge — single dispatcher, fans out to in-app feed + email queue per the matrix in C.

### RPCs
- `get_employer_pipeline(p_company_id uuid default null, p_job_id uuid default null) returns jsonb` — bucketed counts per lane for kanban headers. Admin scope passes `null` company.
- `get_application_thread_summary(p_application_id uuid) returns jsonb` — last message preview + unread count, used by Gro10xInbox row.

---

## Frontend file plan

### New (shared)
- `src/components/applications/ApplicationKanban.tsx` — used by both A and B
- `src/components/applications/ApplicationKanbanCard.tsx`
- `src/components/applications/ApplicationDetailSheet.tsx`
- `src/components/applications/ApplicationFilters.tsx`
- `src/components/applications/ApplicationMessageThread.tsx` — used in talent + recruiter surfaces
- `src/components/applications/MessageComposer.tsx`
- `src/hooks/useApplicationMessages.ts` (with realtime)
- `src/hooks/useEmployerPipeline.ts`
- `supabase/functions/notify-application-status/index.ts`

### Gro10x (A)
- `src/gro10x/pages/work/Gro10xJobApplicants.tsx` — rewritten as kanban shell
- `src/gro10x/pages/work/Gro10xApplications.tsx` — new roll-up across all jobs in the company
- `src/gro10x/pages/Gro10xInbox.tsx` — extended to render `Application: {Job} — {Candidate}` threads

### Admin (B)
- `src/pages/admin/jobs/AdminApplicationsPipeline.tsx` — admin scope shell

### Talent (C, D, F)
- `src/pages/app/AppApplicationDetail.tsx` — add Messages section + Restore button
- Talent messenger entry list — add application threads

### Public (E)
- `src/pages/PublicJobDetail.tsx` — full rewrite mirroring the 3.4 layout
- `src/App.tsx` — ensure public route uses new component (no other route changes since A and B use existing Gro10x and admin routes)

---

## Out of scope (later phases)
- **Gro10xCRM** — company contacts, lead pipeline, deal tracking — separate phase
- Offer-letter generation
- Calendar / interview scheduling
- Multi-stage assessment workflow
- Talent-initiated cold outreach to recruiters (current connection-fee model unchanged)
- A `company_manager` role distinct from admin — recruiters acting on the pipeline use existing company-membership check; finer-grained roles come later

---

## Open questions

1. **Audit log retention** — keep all status moves forever, or auto-archive after 12 months? Recommendation: keep forever (low row volume, high HR/legal value).
2. **Email cadence for messages** — 15-min digest with instant-on-first-message (my recommendation), or always instant?
3. **Withdrawn lane visibility** — show in employer kanban by default, or hidden behind a filter toggle? Recommendation: hidden by default, toggle to show.

Approve to proceed, or tell me which of A–F to drop / reorder.
