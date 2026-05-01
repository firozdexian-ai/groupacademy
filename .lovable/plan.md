## Status answer (your question first)

**Have we transformed all course tasks into gigs?** — No, not yet. The infrastructure is built, but **0 content gigs have actually been generated**. Here's the exact state:

| Layer | Status |
|---|---|
| `content_gigs` table + RLS + Postgres functions (`generate_content_gigs_for_course`, `approve_content_gig`) | Built |
| Admin: Content Ops sidebar group → Readiness Board / Content Gigs / Content Leads | Wired (visible to you on `/dashboard`) |
| Talent: `/app/studio` Content Studio page | Built, but only renders for `content_lead` role |
| "Generate Gigs" button on each course in `ModuleResourcesManager` | Built — but **never clicked**, so `content_gigs` is empty (0 rows) |
| Your admin account `Grow10xnow@therategmail.com` in `user_roles` | **No rows at all** — not even an `admin` row, and no `content_lead` row |

**Why you can't "see all the gigs from the talent panel":** the talent-side Content Studio (`/app/studio`) is RLS-gated to users with `content_lead` role. Admins can review them on `/dashboard → Content Ops`, but there's no talent-side preview for an admin to QA them in their natural habitat. And right now there's nothing to see anyway because no course has been "generated" yet.

Separately on `/app/gigs?tab=projects` (where you currently are): that tab reads `marketplace_gigs` which has **0 rows**. So the Projects tab is also empty.

---

## What this plan does

Two goals: (1) make the gig system actually populated and admin-previewable end-to-end, (2) restructure the gig economy into something coherent instead of three disconnected silos.

### Current confusion (the real problem)

We have **three parallel "gig" systems** that look the same to users but behave totally differently:

```text
/app/gigs?tab=tasks      → table: gigs              → micro-actions, instant credits  (5 rows, working)
/app/gigs?tab=projects   → table: marketplace_gigs  → employer projects, bid + contract (0 rows, empty)
/app/studio              → table: content_gigs      → internal academy build-out         (0 rows, empty, RLS hidden)
```

Talents see no relationship between them. Admin has no single "all gigs across the platform" view. Content gigs are invisible from the public gig hub even though they're literally the highest-paying recurring earning opportunity right now.

---

## Plan

### 1. Surface Content Studio inside the unified Gig Hub

Add a 4th tab on `/app/gigs`: **"Build Academy"** (label TBD). This tab embeds the existing `ContentStudio` view but with role-aware behavior:

- **Admin (`has_any_admin_role`)**: sees ALL content gigs across all schools, read-only preview of how they'd render to a Content Lead, with a "Filter by school" dropdown so you can verify each faculty looks right.
- **Content Lead**: sees gigs scoped to their assigned school (current RLS).
- **Regular talent**: sees a marketing card → "Apply to become a Content Lead" with an inline application form (writes to a new `content_lead_applications` table).

This keeps `/app/studio` working as a deep link but also makes content gigs discoverable from the central hub.

### 2. Seed real content gigs so the system isn't empty

Add a one-shot admin action on the **Readiness Board**: "Generate gigs for all unready courses." This loops through every course where `is_ready = false` and calls `generate_content_gigs_for_course(course_id)` for each. Result: hundreds of real, claimable gigs appear instantly across the academies.

Also add a per-school "Generate gigs for this school" button so you can do it gradually faculty-by-faculty.

### 3. Give your admin account the right roles

Insert two `user_roles` rows for `Grow10xnow@therategmail.com`:
- `admin` (so admin RLS paths work consistently — currently you may be relying on a different admin check)
- `content_lead` with `scope_school_id = NULL` (means "all schools") so the talent-side `/app/studio` and the new "Build Academy" tab show you everything as a Content Lead would see it.

This is the cleanest way to "see what talents see" without building a separate impersonation system.

### 4. Unify the Activity / Registry tab

Today the "Registry" tab on `/app/gigs` only shows quick-task submissions + marketplace bids/contracts. Add a third section: **"Content Studio submissions"** showing your claimed/submitted/approved content gigs in the same visual language. One place to see everything you've ever earned from.

### 5. Admin: one cross-system "All Gigs" view

In `/dashboard → Content Ops`, add a new tab **"All Gigs (cross-system)"** that unions the three tables into a single sortable list with columns: Source (Quick / Project / Content), Title, School/Category, Reward, Status, Claimed by, Submitted at. This is the single place where you can audit the entire gig economy.

### 6. Fix the gig economy gaps (your "deep dive" ask)

Findings from auditing the three systems:

**a. No ownership signaling.** `marketplace_gigs` has employer fields but `content_gigs` has no "publisher" — it just appears. Add a small "Posted by GroUp Academy / by [Employer Name] / by [School]" line on every gig card so talents understand who's paying.

**b. Duplicate categorization vocabularies.** Quick gigs use `category` (cv_upload, etc.), marketplace uses `skill_category` (MARKETPLACE_SCHOOLS), content uses `school_id` + `resource_type`. Talents can't filter coherently. Plan: add a unified `gig_facet` derived field per source so the hub-level filter ("Marketing School", "All Schools", "Quick wins") works across all three.

**c. No earnings forecast.** A talent has no idea "if I do everything available to me, how much can I earn this week?" Add a small header card on `/app/gigs`: "X open gigs, max earn potential Y credits". Computed from `gigs.max_completions_per_user`, claimable `marketplace_gigs.budget_amount`, and open `content_gigs.credit_reward`.

**d. Content gigs have no expiry / SLA.** Once claimed, a Content Lead can sit on it forever blocking everyone else. Add a 7-day auto-release: a daily Postgres function resets `status='open'` and clears `claimed_by` if `claimed_at < now() - 7 days` and not yet submitted.

**e. No quality bar.** `approve_content_gig` pays out on a binary approve. Add a `quality_score` (1-5) by the reviewer that multiplies the credit reward (0.6× / 0.8× / 1.0× / 1.1× / 1.25×). This rewards Content Leads who deliver clean work and prevents pay parity for sloppy submissions.

**f. Marketplace projects are empty.** The Projects tab shows nothing because `marketplace_gigs` is at 0 rows. Either (i) seed 5-10 sample academy-internal projects so the tab demonstrates value while we ramp employer onboarding, or (ii) collapse the Projects tab into a "Coming soon — accepting employer waitlist" CTA. Recommend option (i) using academy-funded projects (e.g., "Build a 30-min YouTube explainer for our Marketing School", budget paid in earned credits) — this also doubles as content gigs by another name.

### 7. Communication: rename so talents understand

Current labels are inconsistent ("Missions" / "Projects" / "Registry" + "Content Studio"). Rename to:

```text
Earn  →  Quick (5–25 credits, instant)  |  Projects (variable, bidding)  |  Build Academy (claim & deliver)  |  My activity
```

Same component, clearer mental model.

---

## Technical breakdown

**DB (single migration):**
- INSERT two rows into `user_roles` for the admin user (`admin`, `content_lead` with NULL scope).
- Create `content_lead_applications` table (talent_id, motivation, school_preference, status, reviewed_by, reviewed_at) with RLS: insert by self, select by self + admin.
- Add `quality_score smallint` to `content_gigs`; modify `approve_content_gig` to accept it and scale the credit payout.
- New function `release_stale_content_gigs()` + a `pg_cron` daily schedule (or trigger on read).
- New function `generate_content_gigs_for_school(_school_id)` and `generate_content_gigs_for_all_unready()` wrapping the existing per-course generator.

**Frontend:**
- `src/pages/app/Gigs.tsx`: add 4th tab "Build Academy" and rename existing tabs; add earnings forecast header card; add "Content Studio submissions" section to the Activity tab; unified `gig_facet` filter logic.
- New `src/components/gigs/BuildAcademyTab.tsx`: role-aware wrapper around the existing `ContentStudio` rendering (admin gets all-school read-only view, content_lead gets scoped view, talent gets application CTA).
- `src/components/dashboard/ContentReadinessBoard.tsx`: add "Generate gigs for all unready courses" button + per-school button.
- New `src/components/dashboard/AllGigsCrossSystem.tsx`: unioned view across `gigs`, `marketplace_gigs`, `content_gigs`. Wire into Dashboard router + AdminSidebar Content Ops group.
- `src/components/dashboard/ContentGigReview.tsx`: add quality_score selector before approve.
- (Optional, recommended) seed 5-10 academy-funded `marketplace_gigs` rows so the Projects tab is non-empty.

**Files to edit (~9) and create (~3):**
- Edit: `Gigs.tsx`, `Dashboard.tsx`, `AdminSidebar.tsx`, `ContentReadinessBoard.tsx`, `ContentGigReview.tsx`, `ContentStudio.tsx` (pass-through prop for admin mode), `MySubmissions.tsx` (extend or wrap).
- Create: `BuildAcademyTab.tsx`, `AllGigsCrossSystem.tsx`, `ContentLeadApplyDialog.tsx`.
- Migration: 1 new SQL file.
