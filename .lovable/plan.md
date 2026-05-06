
# Phase 4.1 — Instructor Workspace & Authoring v2

Closed-loop instructor model. We never open public "anyone can author" sign-up. Instead, **every course slot is a job**: admin/curriculum lead defines the course brief → platform auto-creates an `instructor_job` post → candidates apply through the existing Jobs pipeline → one is hired and unlocked as Instructor for that specific course.

Reuses Phase 3.5–3.7 infra (jobs, kanban, interviews, offers) so we don't rebuild hiring.

---

## A. Instructor recruitment (closed loop)

### Course Brief → Auto Job Post
- New admin entry point: **Learn → Course Briefs** (`/dashboard/learn/briefs`).
- A brief captures: working title, target audience, syllabus outline, expected modules/items, delivery mode (recorded / live cohort / hybrid), language(s), expected duration, target launch date, **instructor budget** (flat fee + revenue share override if any), and required credentials/skills.
- On `Publish brief`, a hidden-but-discoverable **`instructor_job`** is auto-created in the Jobs system:
  - Posted under the **Group Academy** company.
  - Tagged `job_kind = 'instructor'`, linked via `course_brief_id`.
  - Application form auto-includes: sample lesson upload, 2-min teaching video link, portfolio of past courses, expected revenue split.
- Fully reuses the 3.5 kanban + 3.7 interviews + offers. The "Offer" letter is templated as an **Instructor Engagement Agreement** (60/40 default, brief overrides allowed).
- Acceptance trigger: when the offer is `accepted`, a row is written into `course_instructors (course_id, user_id, role, revenue_share_pct, ai_credit_cap, status='active')` and the talent's `user_role` gains the new `instructor` role scoped to that course only.

### Why job-system reuse
- No parallel application UI to maintain.
- Interview/offer/notification flows already work.
- Admin oversight (Phase 3.5 admin kanban) shows instructor pipelines next to regular jobs, filterable by `job_kind`.

### Limits
- A course brief can only have **one** active instructor (co-instructors as a stretch goal in 4.2).
- Closing or filling the brief auto-archives the underlying instructor job.
- Talent cannot self-apply to be a generic instructor; they only apply against an open brief — keeps the loop closed.

---

## B. Instructor Workspace (`/app/instructor`)

A single shell visible only when `course_instructors.status='active'` exists for the user. Tabs:

1. **My Courses** — courses the user is contracted to author/teach. Status pill: `drafting → in_review → published → live → archived`.
2. **Modules & Lessons** — drag-and-drop builder over `course_modules`. Lesson types: video, article, quiz, scenario, project, live session.
3. **Item Bank** — composer for MCQ / MRQ / scenario / rubric. Inline AI assist (existing `ai-item-rewrite`, `ai-item-translate`) plus new `ai-item-generate` (from transcript or PDF). Every AI call debits **instructor credits** (see Section D).
4. **Review Queue** — reuses existing `InstructorReviewQueue` page; nudges from `get_authoring_review_digest`.
5. **Insights** — reuses `InstructorInsights` (p-values, mastery rollup, authoring trends).
6. **Translations** — sidecar UI for `module_item_translations` (10 langs) with bulk AI translate.
7. **Earnings** — gross sales, platform 40%, instructor 60%, pending payout, last withdrawal. Reuses existing wallet/withdrawals infra.
8. **AI Credits** — current balance, monthly grant, top-up via personal credits at 1cr=2 BDT.

### Publishing workflow (gated)
`draft → submit_for_review → admin_review → published`
- Admin queue lives in **Learn → Course Approvals** (Group #11 area).
- First publish on any course always requires admin approval. After 2 approved publishes, future minor edits auto-publish but **major edits** (new module, syllabus change, price change) re-trigger review.

---

## C. Revenue model (60/40)

- Default split: **60% instructor / 40% platform** on net revenue (after gateway fees and refunds), recorded per sale.
- Brief can override (e.g., 70/30 for a marquee instructor) — captured in `course_instructors.revenue_share_pct`.
- Sale ledger: extend existing transactions with `course_revenue_splits (sale_id, course_id, instructor_id, gross, fees, net, instructor_amount, platform_amount, status)`.
- **Cohort-based revenue** for live cohorts: split applied per enrollment at end of cohort; refunds reverse the split.
- Instructor sees ledger in **Earnings**; admin sees aggregated payout queue in **Learn → Payouts**.
- Withdrawal reuses `withdrawals` (existing): instructors withdraw earnings the same way creators withdraw Hype earnings.

---

## D. AI authoring as **instructor credits**

We don't make AI free (cost control) and we don't bill from talent's personal wallet (mixes purposes). We add a dedicated **instructor credit pool**.

### Model
- New table `instructor_credit_balances (user_id, course_id, balance numeric(12,1), monthly_grant numeric(12,1), updated_at)`.
- New table `instructor_credit_ledger (id, user_id, course_id, delta numeric(12,1), reason, ref_id, created_at)`.
- **Grant rules** (simple, tunable later):
  - On instructor onboarding for a course: **+50 credits** seed grant.
  - Monthly auto-grant while course is in `drafting` or `in_review`: **+30 credits**.
  - +1 credit per **5** approved item edits shipped (small productivity bonus).
- **Cost rules** (per AI call, fractional, mem: Fractional Credits):
  - `ai-item-generate` (single item from prompt): 0.5 credit
  - `ai-item-generate` (bulk from transcript/PDF, per item produced): 0.3 credit
  - `ai-item-rewrite`: 0.2 credit
  - `ai-item-translate` (per language per item): 0.1 credit
  - Scenario auto-grading test runs: 0.2 credit
- **Top-up**: instructor can convert **personal credits → instructor credits** at parity (1:1) inside the same course. Locked to that course to prevent farming.
- **Insufficient balance**: AI buttons disable with a "Top up" CTA; manual authoring always remains free.

### Why credits, not free
- AI cost is real and concentrated on heavy authors.
- Forces instructors to value the tool and prevents "regenerate 50 times" loops.
- Gives a clean lever to reward productive authors via grants tied to approved output.

---

## E. Talent-side touchpoints

- New job type filter on `/app/jobs`: **"Teach with us"** chip surfacing all open instructor briefs (still uses normal jobs UI; just a saved filter).
- Course detail page shows instructor card with verified credentials (ties to Skill Credentials).
- "Become an instructor" CTA in profile menu deep-links to the Teach-with-us filter — **never** to a self-serve form.

---

## F. Admin surfaces (`/dashboard/learn/...`)

- **Course Briefs** — create/edit briefs, view linked instructor job pipeline inline.
- **Course Approvals** — review queue for `submit_for_review` courses + major edits; approve / request changes / reject with note.
- **Instructor Roster** — table of active instructors, courses, revenue YTD, AI credit usage, NPS.
- **Payouts** — instructor split queue, mark paid, export CSV (mem: Workforce Commissions pattern).
- Lives under existing **Group #11 Learn** (mem: Admin Groups 11-16).

---

## G. Database delta (migrations)

- `course_briefs (id, title, summary, syllabus jsonb, mode, language, duration_weeks, target_launch, budget_amount, revenue_share_pct, status, created_by, created_at, instructor_job_id, instructor_user_id)`.
- Extend `jobs`: nullable `job_kind text default 'employer'` + `course_brief_id uuid`.
- `course_instructors (id, course_id, user_id, role, revenue_share_pct, ai_credit_cap, status, hired_via_application_id, started_at, ended_at)`.
- `course_revenue_splits` (above).
- `instructor_credit_balances`, `instructor_credit_ledger` (above).
- New `app_role` value: `'instructor'`. Granted only via `course_instructors` activation; revoked when no active courses remain. RLS: instructors can only edit content of courses they're active on (via `is_course_instructor(course_id, auth.uid())`).
- Trigger `trg_offer_accepted_instructor`: when an `offers` row tied to an `instructor_job` is accepted, insert into `course_instructors` and grant role.
- Trigger `trg_grant_instructor_seed_credits`: on `course_instructors` insert.
- All functions use `set search_path = public` (mem: Security).

---

## H. Edge functions / RPCs

- `create-instructor-job-from-brief` (admin) — atomic brief publish → job creation.
- `submit-course-for-review` (instructor).
- `approve-course-publish` (admin) — moves to `published`, emits notifications.
- `instructor-credit-debit` — wraps any AI authoring call; checks balance, deducts, logs.
- `compute-course-revenue-split` — runs on `transactions.completed` for course sales.
- `ai-item-generate` (new) — uses Lovable AI Gateway (`google/gemini-2.5-flash` default for cost; `gpt-5-mini` for nuanced rewrites).
- All edges verify `auth.getUser(token)` and instructor RBAC (mem: Edge Function Security).

---

## I. Frontend file plan

- `src/pages/app/instructor/InstructorShell.tsx` (tabs)
- `src/pages/app/instructor/MyCoursesTab.tsx`
- `src/pages/app/instructor/ModulesBuilder.tsx`
- `src/pages/app/instructor/ItemBankComposer.tsx`
- `src/pages/app/instructor/EarningsTab.tsx`
- `src/pages/app/instructor/AiCreditsTab.tsx`
- `src/components/instructor/AiGenerateDialog.tsx`
- `src/components/instructor/CreditMeter.tsx`
- `src/components/instructor/PublishGate.tsx`
- `src/hooks/useInstructorCourses.ts`, `useInstructorCredits.ts`, `useInstructorEarnings.ts`
- Admin: `src/components/dashboard/learn/CourseBriefsTab.tsx`, `CourseApprovalsTab.tsx`, `InstructorRosterTab.tsx`, `InstructorPayoutsTab.tsx`.
- Admin sidebar: add 4 entries under Learn group.
- Routes: register `/app/instructor` in `App.tsx`; admin tabs added to `Dashboard.tsx` lazy map.

---

## J. Out of scope for 4.1 (parked for later sub-phases)

- Co-instructors / TAs (4.2 cohorts).
- Live class delivery (4.2).
- Discussions/Q&A (4.3).
- Self-serve instructor sign-up — **explicitly never**.
- Tax invoicing for instructor payouts beyond CSV export.

---

## K. Open questions

1. **Brief budget structure** — flat fee on hire + revenue share, or revenue share only? Recommendation: small flat fee (covers authoring time) + 60/40 on sales after launch.
2. **Monthly AI credit grant size** — start at 30/month per active drafting course or smaller (e.g., 20)? Recommendation: 30 to encourage authoring; tune with telemetry.
3. **First-time instructor escrow** — hold first month's payout for 30 days as quality buffer (refund risk)? Recommendation: yes for first course only.
4. **Major-edit definition** — auto-detect (new module / >20% item churn / price change) or instructor-flagged? Recommendation: auto-detect via diff service to keep workflow honest.

Approve to start implementing 4.1, or tell me which of A–F to drop / reorder.
