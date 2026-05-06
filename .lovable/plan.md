# Phase 4.5b + 4.6 — Combined Plan

Two complementary phases shipped together: 4.5b makes Gro10x feel native on desktop, and 4.6 turns the learning data we now have (mastery, credentials, track completions) into hiring signal across `/jobs`, employer CRM, and public talent profiles.

They pair well because both touch the same surfaces (Inbox, CRM, talent cards, jobs pipeline) — doing them in one pass avoids re-touching components twice.

---

## Phase 4.5b — Desktop Polish

Goal: Gro10x at ≥1024px stops feeling like a stretched mobile app.

### 1. Three-pane Inbox & CRM
```text
+----------+--------------------+----------------+
| Sidenav  | List (threads /    | Thread / Detail|
|          | talents / leads)   | + Context rail |
+----------+--------------------+----------------+
```
- New `ThreePaneLayout` primitive (list | detail | context), responsive: stacks on <lg.
- Apply to `Gro10xInbox`, `Gro10xCRM`, `Gro10xLearnOps` (assignment detail), `/app/instructor/review-queue`.
- Context rail surfaces: talent mastery summary, last 3 enrollments, verified skills, open jobs (CRM); thread metadata + linked application/track (Inbox).

### 2. Command palette (⌘K)
- `Gro10xCommandPalette` using `cmdk`.
- Sections: Navigate, Companies, Talents, Courses, Tracks, Jobs, Recent.
- Backed by one new RPC `gro10x_global_search(q, limit)` returning typed rows (kind, id, title, subtitle, url).
- Keyboard: ⌘K open, ↑/↓ navigate, Enter open, ⌘Enter open in new tab.

### 3. Working global search
- Wire the existing top-bar search to the same RPC (debounced, 200ms), with grouped results dropdown.

### 4. Desktop chrome polish
- Persistent collapsible sidenav state (localStorage), keyboard shortcut `[`.
- Breadcrumbs in `Gro10xAppShell` header on ≥md.
- Tighter desktop density (reduce paddings on cards/tables at lg+ only — mobile untouched per memory rule).

### 5. Dev/QA
- Test at 1920, 1440, 1024, 768, 393.
- No new mobile regressions (memory: vertical-only mobile, py-2 spacing preserved).

---

## Phase 4.6 — Learner Outcomes → Employer Signals

Goal: Mastery + credentials + track completions become first-class signals in hiring, CRM, and public profiles.

### 1. Talent signal payload (shared)
New RPC `get_talent_outcome_signal(talent_id)` returning:
- `verified_skills[]` (from skill_credentials, with topic + level + issued_at)
- `tracks_completed[]` (track title, company sponsor if any, completed_at, certificate code)
- `mastery_summary` (top 5 strong topics, weak topics count)
- `learning_recency_score` (0–1, decays over 90 days)

Used by every surface below — single source of truth.

### 2. `/jobs` — Verified candidate boost
- Extend `score-job-match` and `suggest-jobs-for-talent` to read outcome signal:
  - +boost when verified skill matches a required skill on the job.
  - New `outcome_match` block in match payload.
- `VerifiedMatchBadge` already exists (memory: Mastery Job Match) — add new `TrackCompletionBadge` and `RecentLearnerChip` (active in last 30d).

### 3. Employer pipeline (`/gro10x/work` + admin)
- `get_employer_pipeline` returns outcome signal alongside each application.
- Application card: verified skill chips, completed tracks, "Active learner" indicator.
- New filter on Sourcing (`search_public_talents`): `completed_track_id`, `has_verified_skill`, `learning_recency`.
- CRM talent detail rail (from 4.5b context pane) shows the same signal block — one component `TalentSignalPanel`.

### 4. Public talent profile (`/t/:handle`)
- Add "Verified Outcomes" section: skill credentials grid + completed tracks timeline.
- Update `get_public_talent_profile` RPC to include the outcome signal (only public-flagged credentials).
- JSON-LD: add `EducationalOccupationalCredential` entries for each verified skill / track certificate.

### 5. Hiring loop nudge
- `cron-hiring-signal-sweep` (daily): when a sourced/applied talent completes a track or earns a credential relevant to an open application, push a message into `application_messages` ("New verified skill: X") and notify the employer.

### 6. Admin oversight
- New tab in admin Talents group → "Outcomes & Signals": leaderboards (most verified skills this week, tracks completed, employer signals fired), abuse/quality flags.

---

## Technical details

### New / changed DB
- RPC: `gro10x_global_search`, `get_talent_outcome_signal`.
- Extend RPCs: `score-job-match`, `suggest-jobs-for-talent`, `get_employer_pipeline`, `search_public_talents`, `get_public_talent_profile`.
- New cron: `cron-hiring-signal-sweep` (06:30 UTC daily).
- No new tables — reuses `skill_credentials`, `learning_track_assignments`, `certificates`, `talent_skill_profile`.

### New components
- `src/gro10x/components/layout/ThreePaneLayout.tsx`
- `src/gro10x/components/Gro10xCommandPalette.tsx`
- `src/components/talent/TalentSignalPanel.tsx`
- `src/components/talent/TrackCompletionBadge.tsx`
- `src/components/talent/RecentLearnerChip.tsx`

### Edited surfaces
- `Gro10xInbox`, `Gro10xCRM`, `Gro10xLearnOps`, `Gro10xAppShell`, `Gro10xSideNav`
- `src/pages/app/JobDetail*`, `WhyYouMatchPanel`, employer pipeline kanban, admin Talents tab, `/t/:handle`.

### Out of scope (deferred to 4.7)
- Instructor payouts / Stripe Connect.
- Employer-side billing for sourcing premium filters.

---

## Open questions
1. Should "verified skill" boost in `/jobs` be visible to all talents or only above a mastery threshold (e.g. ≥0.7)? Recommend ≥0.7 to keep the signal trustworthy.
2. For the public profile, should completed *company-sponsored* tracks show the sponsor's logo, or stay neutral? Recommend show sponsor (more credible, drives B2B branding).
