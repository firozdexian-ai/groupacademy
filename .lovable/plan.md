# Cleanup: One Gig Model — Course as a Project

You currently have **two parallel systems** for "build the course" work, which is why it feels messy:

| | Old (to discard) | New (keep) |
|---|---|---|
| Table | `content_gigs` | `course_projects` + `course_project_subtasks` |
| Talent UI | `BuildAcademyTab`, `/app/studio` (ContentStudio) | Course Projects section in `/app/gigs` + `/app/course-project/:id` |
| Admin UI | Readiness Board, Content Gigs, All Gigs (cross-system), Content Leads | Course Projects manager |
| RPC | `generate_content_gigs_for_course/_school/_all_unready`, `release_stale_content_gigs` | `generate_course_project`, `delete_course_project` |

We'll keep only the **course-as-project** flow (the one you're happy with) and delete the old `content_gigs` surfaces end-to-end so admins and talents see one consistent thing.

---

## 1. Talent-side cleanup

- **`src/pages/app/Gigs.tsx`**: remove the "Content Studio" banner shown to content leads (lines ~256–273) and the `hasContentRole` state. Build work now flows through "Course Projects" only.
- **Delete** `src/components/gigs/BuildAcademyTab.tsx` (no longer mounted anywhere after step 1).
- **Delete** `src/pages/app/ContentStudio.tsx` and remove its route from `src/App.tsx` (`<Route path="studio" …>`) plus the nav entry in `src/layouts/TalentAppShell.tsx` ("Content Studio" quick link).
- **`src/components/gigs/GigSubmissionForm.tsx`**: drop the `ContentCreationGigForm` and `CourseResellGigForm` branches — the per-resource submit now happens inside the course-project subtask flow. **Delete** both form files.

## 2. Admin-side cleanup

In `src/pages/Dashboard.tsx`:
- Remove tab registrations: `content-readiness`, `content-gigs`, `content-leads`, `all-gigs` (lines ~272–283).
- Remove their `TAB_TITLES` entries.

In `src/components/dashboard/AdminSidebar.tsx`:
- Delete the entire **"Content Ops"** group (lines 180–189).
- Keep `Course Projects` under **Learning** as the single entry point for build work.

**Delete** the four admin components no longer referenced:
- `src/components/dashboard/ContentReadinessBoard.tsx`
- `src/components/dashboard/ContentGigReview.tsx`
- `src/components/dashboard/AllGigsCrossSystem.tsx`
- `src/components/dashboard/ContentLeadsManager.tsx` (verify no other usage first)

## 3. Module Resources page cleanup

`src/pages/ModuleResourcesManager.tsx` calls `generate_content_gigs_for_course` (line 278). Replace that "Generate gigs" affordance with a **"Open in Course Projects"** link that navigates to `/dashboard?tab=course-projects` — the new manager covers the same need (auto-generate subtasks per module) and respects the new model.

## 4. Database cleanup (migration)

New migration that:
- Drops RPCs: `generate_content_gigs_for_course`, `generate_content_gigs_for_school`, `generate_content_gigs_for_all_unready`, `release_stale_content_gigs`.
- Drops table `public.content_gigs` (with `CASCADE` to remove dependent FKs / policies). Any historical claims live under the new `course_project_subtasks`.
- Leaves `course_projects`, `course_project_subtasks`, `gigs` (quick tasks), and `marketplace_gigs` untouched.

Because this drops a table, the migration will surface a destructive-change confirmation; that's expected and required to actually clean up.

## 5. Sanity sweep

After deletes, run a project-wide grep for `content_gigs`, `BuildAcademy`, `ContentStudio`, `content-readiness`, `content-gigs`, `all-gigs`, `content-leads`, and remove any stragglers (imports, dead route guards, sidebar fallbacks, generated types references will refresh automatically after the migration).

---

## Files touched

**Edited**
- `src/pages/app/Gigs.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/AdminSidebar.tsx`
- `src/components/gigs/GigSubmissionForm.tsx`
- `src/layouts/TalentAppShell.tsx`
- `src/pages/ModuleResourcesManager.tsx`
- `src/App.tsx`

**Deleted**
- `src/components/gigs/BuildAcademyTab.tsx`
- `src/components/gigs/ContentCreationGigForm.tsx`
- `src/components/gigs/CourseResellGigForm.tsx`
- `src/pages/app/ContentStudio.tsx`
- `src/components/dashboard/ContentReadinessBoard.tsx`
- `src/components/dashboard/ContentGigReview.tsx`
- `src/components/dashboard/AllGigsCrossSystem.tsx`
- `src/components/dashboard/ContentLeadsManager.tsx`

**Migration (new)**
- Drop `content_gigs` table + the four `generate_content_gigs_*` / `release_stale_content_gigs` functions.

## Out of scope (kept as-is)
- Quick Tasks (`gigs` table) — different flow, working fine.
- Marketplace Gigs (employer-posted) — separate system.
- `Course Projects` manager and talent UI — already approved.

Approve and I'll execute the cleanup + migration in one pass.
