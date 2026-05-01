## Phase 11D — Learning Hub: Readiness Gating + Content Gig Economy

### The two ideas (in plain English)

1. **Only show what is actually finished.** Today the Academy lists ~1,093 courses but only **1** has all its module resources uploaded. We will hide every course that is not 100% complete, and only show a Pathway/Track once **all** its courses are complete. The catalog will look small but trustworthy instead of large and broken.

2. **Turn every missing piece into paid work.** Each empty module/stage becomes a private "Content Creation" gig. These gigs are **invisible to the public**. Only people we hire as a school's "Content Lead" can see and claim the gigs for their school. When they upload the resource and admin approves it, they get paid in credits — and that resource auto-fills the module. This becomes our first revenue/cost lever for filling the academy.

---

### What changes for the talent (front-end)

**Learning Hub → Academy tab (`CoursesTab.tsx`)**
- Query gains a `.eq("is_ready", true)` filter on a new `content_readiness` view (or a `is_ready` boolean column on `content` kept fresh by trigger).
- Empty state copy changes from "Awaiting registry updates" to: *"Our team is finishing this academy. New courses are unlocked the moment they're 100% ready."*
- Add a small "X of Y courses ready" counter at the top of each filter.

**Learning Hub → Pathways tab (`TracksTab.tsx`)**
- Each School card shows a readiness badge: `12 / 18 courses ready` with a thin progress bar.
- A School is only clickable (route to `/app/learning/tracks/school/:slug`) when **100% of its courses are ready**. Locked schools show a "Coming soon" overlay and a "Notify me" button (writes to a new `school_waitlist` table).

**My Hub (`MyCoursesTab.tsx`)** — unchanged. Already-enrolled users keep access regardless of readiness.

---

### What changes in the database

New columns / view (single migration):
- `content.is_ready boolean default false` — true only when every module has ≥1 module_resource AND every required resource has a non-empty `resource_url`.
- `schools.is_ready boolean default false` — true only when every published course tied to it is_ready.
- DB function `recompute_content_readiness(content_id)` + trigger on `module_resources` (insert/update/delete) and on `course_modules` to keep both flags fresh.
- View `school_readiness_v` (school_id, total_courses, ready_courses, pct) for the UI counters.
- Table `school_waitlist (id, talent_id, school_id, created_at)` with RLS (talent can insert/select own).

Note: `content` has no direct `school_id`, only `profession_line_id`. We will use a helper function `school_id_for_content(content_id)` that resolves school via profession_line → school. If no link exists, the course is treated as "unassigned" and excluded from school readiness math.

---

### The content gig economy

**New table `content_gigs`** (separate from existing `gigs` and `marketplace_gigs` because the workflow is different):
```
id, module_id, resource_slot (e.g. 'orientation_video', 'learn_pdf', 'practice_quiz', ...),
school_id, title, brief, expected_format,
credit_reward numeric(12,1),
status: open | claimed | submitted | approved | rejected,
claimed_by talent_id, claimed_at, submitted_url, submitted_at,
reviewed_by, reviewed_at, review_notes
```

**Auto-generation:** A scheduled function (or trigger on `course_modules` insert) creates one `content_gig` row per missing required resource per module per stage (Orientation/Learn/Discuss/Practice/Assess/Progress). Default reward configurable per resource type (e.g. video = 30 CR, PDF = 10 CR).

**Visibility / RLS:**
- `content_gigs` is NOT shown in the public Gigs page.
- New role `content_lead` in `user_roles` with optional `school_id` scope (`user_roles.scope_school_id`).
- RLS: a talent can `SELECT` a row only if they have `content_lead` for that gig's `school_id` (or are admin). No public read.

**New page `src/pages/app/ContentStudio.tsx`** at route `/app/studio` — only visible to users with the `content_lead` role:
- Lists open gigs for their school, shows brief + expected format
- Claim → upload resource (uses existing `module_resources` upload pattern) → submit
- Admin reviews in the Admin dashboard (`src/components/dashboard/ContentGigReview.tsx`) → approve auto-inserts the row into `module_resources`, marks gig `approved`, credits the lead, and triggers readiness recompute.

**Sidebar entry:** "Content Studio" appears in `TalentAppShell.tsx` only when the user has the `content_lead` role.

---

### Admin side (brief)

In the existing admin dashboard:
- New "Content Operations" group with: **Readiness Board** (per-school progress bars), **Open Content Gigs**, **Pending Reviews**, **Content Leads** (assign role + school scope to a talent).
- One-click "Generate gigs for this course" button on each course in `ModuleResourcesManager.tsx` — calls a function that inserts missing-slot gigs.

---

### Files to be created / edited

**Migration**
- `supabase/migrations/<ts>_learning_readiness_and_content_gigs.sql`
  - alter `content` add `is_ready`; alter `schools` add `is_ready`
  - create `school_waitlist`, `content_gigs`, view `school_readiness_v`
  - functions + triggers for readiness; function `generate_content_gigs_for_course(content_id)`
  - `app_role` enum gains `content_lead`; `user_roles` gains nullable `scope_school_id`
  - RLS policies for all new tables

**Front-end (talent)**
- edit `src/components/learning/CoursesTab.tsx` (filter `is_ready`)
- edit `src/components/learning/TracksTab.tsx` (school readiness badges + lock state)
- edit `src/components/learning/MyCoursesTab.tsx` (copy nudge only)
- create `src/pages/app/ContentStudio.tsx` + `src/components/studio/ContentGigCard.tsx`
- edit `src/layouts/TalentAppShell.tsx` (conditional Studio entry)
- edit `src/App.tsx` (route `/app/studio`)

**Front-end (admin)**
- create `src/components/dashboard/ContentReadinessBoard.tsx`
- create `src/components/dashboard/ContentGigReview.tsx`
- create `src/components/dashboard/ContentLeadsManager.tsx`
- edit `src/components/dashboard/AdminSidebar.tsx` (new "Content Ops" group)
- edit `src/pages/Dashboard.tsx` (lazy tabs)
- edit `src/pages/ModuleResourcesManager.tsx` (Generate gigs button)

---

### Out of scope for this phase
- Payouts to content leads (uses existing credits → withdrawals path, no new infra)
- Bulk migration of legacy resources (none exist yet for these courses)
- Public marketing of the program (will revisit once readiness > 0)

---

### Result the user will see immediately

1. Academy tab shows ~1 course (the only complete one), Pathways shows all schools with honest readiness bars and locked overlays. No more sea of empty courses.
2. Admin can hire a "Content Lead" for, say, *School of AI & Automation*, give them the role, and they'll see ~80 paid gigs ready to claim in their Content Studio.
3. Every approved submission flips the right flag and the course/school silently appears in the public catalog the moment it crosses 100%.

Approve to implement?