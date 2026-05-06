## Phase 4.4 — Gro10x Learning Ops (B2B)

Turn the Learning system into a B2B workforce-upskilling product. Companies (Gro10x clients) can sponsor cohorts, assign learners, track team mastery, and pay through their org wallet. Builds on cohorts (4.2), discussions/peer review (4.3), Talent Mirror, and the existing `companies` / `talent_engagements` primitives.

---

### Goals

- A company admin can assign one or more talents into a course/cohort in a few taps, with deadlines and budget.
- Each org gets a Learning Ops dashboard: assignments, completion, attendance, mastery heatmap, peer-review activity, and credit burn.
- Sponsored seats deduct credits from the org wallet (not the learner) and emit invoices.
- Instructors see "Sponsored by {Company}" context on the cohort and roster.
- Admin gets oversight of every B2B engagement and can intervene.

---

### Sub-deliverables

1. **Schema**
   - `org_learning_assignments(id, company_id, assigner_id, talent_id, content_id, cohort_id NULL, due_at, budget_credits numeric(12,1), status enum('invited','active','completed','overdue','cancelled'), created_at)`.
   - `org_learning_seats(id, company_id, content_id, cohort_id NULL, seats_total int, seats_used int, expires_at, source enum('purchase','grant'), created_at)`.
   - `org_wallet_ledger(id, company_id, delta numeric(12,1), reason text, ref_table text, ref_id uuid, created_at)` — mirrors `credit_ledger` but org-scoped.
   - `org_learning_invitations(id, company_id, email, content_id, cohort_id NULL, token, status, expires_at)` — for unregistered hires.
   - Extend `cohorts` with `sponsor_company_id NULL`.
   - Extend `course_enrollments` with `assignment_id NULL`, `sponsor_company_id NULL`.

2. **RPCs**
   - `org_assign_talents(company_id, content_id, cohort_id, talent_ids[], due_at, budget_per_seat)` — atomic: validates seats/credits, creates assignments + enrollments, deducts wallet, emits notifications.
   - `org_team_mastery(company_id, content_id NULL)` — returns per-talent mastery rollup (reuse `learner-talent-mirror` payload, aggregated).
   - `org_learning_health(company_id)` — KPIs: active assignments, on-track %, overdue, attendance %, avg mastery, credits burned MTD.
   - `org_invite_external(company_id, email, content_id, cohort_id)` — issues token, sends email; on signup, auto-attaches assignment.

3. **Triggers**
   - On `org_learning_assignments` insert → create `course_enrollments` row, deduct seats/credits, dispatch `assignment_created` notification.
   - On `course_enrollments.completed_at` set → mark assignment `completed`, refund unused budget if any, notify assigner.
   - On `due_at` past + status='active' → mark `overdue` via cron.

4. **Edge functions**
   - `org-learning-checkout` — purchase seats / top up org wallet (Stripe via existing managed payments).
   - `notify-org-learning` — `assignment_created`, `assignment_overdue`, `assignment_completed`, `seat_low`.
   - `cron-org-learning-sweeps` — every hour: mark overdue, send `seat_low` when seats_used/seats_total ≥ 0.8.

5. **Talent surface (lightweight)**
   - On `/app/courses/:id` and `My Learning`, show "Sponsored by {Company}" pill and due date.
   - Notifications about assignment, deadlines, completion.

6. **Gro10x company surface** — new section `/app/gro10x/learn`:
   - **Overview** — KPI cards (active learners, on-track %, overdue, credits MTD).
   - **Assignments** — table with filters; bulk assign via talent picker.
   - **Catalog** — browse courses, buy seats, launch a cohort branded for the company.
   - **Team Mastery** — heatmap of topics × talents, drill into Talent Mirror.
   - **Wallet & Invoices** — org credit balance, top-up, ledger, receipts.
   - **Activity** — discussions / Q&A / reviews from sponsored cohorts (read-only nudge).

7. **Instructor surface**
   - Roster view (4.2) shows sponsor pill per learner; attendance/mastery filterable by company.

8. **Admin surface**
   - New tab in Learn console: **B2B Engagements** — list of org assignments, drill-in to company, manual seat grant, refund, override status.
   - Companies console gets a **Learning** tab summarizing the same KPIs per company.

---

### Technical Details

#### Database / RLS
- All `org_*` tables RLS scoped via `is_company_member(company_id)` and `is_company_admin(company_id)` helpers (reuse if present, else add). Admin override via `has_role(auth.uid(),'admin')`.
- Realtime on `org_learning_assignments` so company dashboards live-update.
- Ledger writes always inside the RPC (never client) to keep wallet integrity.
- Indexes: `(company_id, status)`, `(company_id, content_id)`, `(talent_id, status)`.

#### Wallet model
- Org wallet uses `numeric(12,1)` like talent wallet (fractional credits memory rule).
- 1 credit = 2 BDT pricing unchanged. Org top-ups via Stripe managed payments → `org_wallet_ledger` += amount.
- Per-seat cost = course `enrollment_credits` (existing field) at assignment time, snapshotted on assignment row.

#### Frontend
- New hooks: `useOrgLearningOverview`, `useOrgAssignments`, `useOrgTeamMastery`, `useOrgWallet`, `useOrgSeats`.
- New components under `src/components/gro10x/learn/`: `OverviewCards`, `AssignmentsTable`, `BulkAssignSheet`, `CatalogGrid`, `TeamMasteryHeatmap`, `WalletPanel`.
- New routes: `/app/gro10x/learn` (tabs).
- Admin: `src/components/dashboard/learn/B2BEngagementsTab.tsx`; companies admin gets `LearningTab.tsx`.

#### UX
- Mobile vertical only; brand tokens; Tech Blue for primary actions, Success Green for on-track, amber for overdue.
- Bulk assign uses existing talent search (`search_public_talents` reused with company-scope filter for prior collaborators).
- Heatmap: rows = talents, cols = topics, cell color via mastery semantic tokens.

---

### Out of scope for 4.4

- Custom branded course authoring per company (4.5).
- AI auto-recommendation of who to assign to which course (4.6).
- SCIM / SSO provisioning for external talents (handled in workforce phase).

---

### Open questions

1. **Pricing for sponsored seats** — same per-course `enrollment_credits` as B2C, or apply a B2B multiplier (e.g. 1.2×) to fund instructor 60/40 + ops? (Recommended: same price, instructor split unchanged; B2B value comes from analytics + invoicing.)
2. **External invitations** — should an invite consume a seat immediately (hold) or only on signup? (Recommended: hold seat on invite, release on expiry.)
3. **Refund policy on cancel** — full credit refund if learner never started, prorated if in progress, none if >50% complete? (Recommended: full if 0% activity, none otherwise; admin override.)
4. **Cohort branding** — allow a company to spin up a private cohort (sponsor-only roster) on any course, or only on courses marked `b2b_enabled`? (Recommended: opt-in flag per course set by instructor/admin.)
