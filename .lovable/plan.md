

# Admin Panel: Bug Fixes, Refactors & UI Cleanup

After auditing the admin panel I found a mix of real bugs, security gaps, dead code, and small UI issues. Grouped by severity below.

## Critical Bugs (functional breakage)

### 1. AdminSidebar role filtering is silently disabled
`src/pages/Dashboard.tsx` (line 153) renders `<AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />` but **never passes `userRole`**. The component default is `"admin"` (`AdminSidebar.tsx` line 201), so `talent_exec` users see every admin-only group (Workforce, Learning, Career Abroad, IR, etc.). Even though `Dashboard.tsx` correctly fetches `role` via `useUserRole`, it's discarded.
**Fix:** pass `userRole={role}` to AdminSidebar.

### 2. Three sidebar entries are dead links
`AdminSidebar.tsx` lists `Free Videos` (`videos`), `Recorded Courses` (`courses`), `Live Sessions` (`webinars`) under Learning, but `TAB_COMPONENTS` in `Dashboard.tsx` has no mappings for these keys. Clicking them shows "Module 'videos' not found."
**Fix:** map them to `ContentList` with the `filter` prop (`free_video`, `recorded_course`, `live_webinar`) — `ContentList` already supports this prop.

### 3. ilike search injection / breakage on special characters
9 dashboards (Companies, Contacts, Jobs, Blog, ContentList, StudyAbroad, Portfolio, Workforce, TalentPool) interpolate raw user input into PostgREST `.or()` ilike strings, e.g. `` `name.ilike.%${debouncedSearch}%,...` ``. A search containing `,` `(` `)` `*` or `%` will either break the query or be misparsed by PostgREST as additional filters.
**Fix:** add a `sanitizeIlike` helper in `src/lib/supabaseQuery.ts` that escapes `%`, `_`, `,`, `(`, `)`, `*`, and `\`, then use it everywhere.

## High Priority

### 4. usePaymentConfig still reads obsolete platform_settings rows
After Stripe migration discussion the hook still queries `payment_gateway`, `stripe_publishable_key`, etc. and falls back to `whatsapp` defaults. Now that built-in Stripe was attempted and the custom flow remains for now, this is fine — but `PaymentSettingsManager.tsx` still calls the **deleted-pending** `update-stripe-secret` edge function, which will produce 404s. We should guard that call so it doesn't surface errors.

### 5. Dashboard layout cuts off wide modules
`src/pages/Dashboard.tsx` line 160 wraps every tab in `max-w-7xl mx-auto`. Tables in `JobApplicationsManager`, `ContactsManager`, `EnrollmentsManager` need more width; users on 1067px viewport (current) get horizontal scrollbars inside cards. **Fix:** drop `max-w-7xl` or raise to `max-w-[1600px]` for the dashboard shell only.

### 6. JobApplicationsManager: search broken across pages
`filteredApplications` (line 571) only filters the **current page** of results client-side — searching for an applicant on page 3 of 50 returns nothing. **Fix:** push search to the server query (join filter via `talents.full_name` ilike) or fetch all then paginate client-side.

## Medium Priority

### 7. WorkforceManager: missing dependency in useEffect
Line 81: `useEffect(() => { fetchMembers(); }, [])` — `fetchMembers` isn't memoised; works today only because the component never re-renders meaningfully. Wrap in `useCallback` to prevent stale-closure bugs once filters are added.

### 8. useUserRole has no error path
`ProtectedRoute.tsx` (lines 168–200): if the `user_roles` query fails, role stays `null` and the user sees an infinite "Loading Command Center..." or gets bounced to `/app/feed`. Add `try/catch` and a toast.

### 9. ~395 stray `console.log/error` calls across 38 dashboard files
Bloats production bundle and leaks query shapes. **Fix:** replace `console.error` with the existing `errorTracking.ts` helper (or strip via Vite `define`).

### 10. ContentList readiness filter loads ALL rows then paginates client-side
Line 142–179: when "readiness" filter is active it fetches every `content` row + every `course_modules` row to compute stats. With growing content this will time out. **Fix:** add a Postgres view or computed column for module readiness counts.

## UI / UX Polish

- **AdminSidebar (line 144):** "Overview" link visible only to admins, but Talent Execs land on `/dashboard` with `activeTab="overview"` (the default) and see "Module not found" because the OverView component is rendered but their role check elsewhere may not block it. Default `activeTab` for talent_exec should be `"talent"`.
- **Sticky header (line 156):** `h-12` is too short for the SidebarTrigger to look balanced; bump to `h-14` and add the page title beside the trigger.
- **Dashboard loading state (line 145):** `<div>Loading Command Center...</div>` is unstyled. Replace with the existing `DashboardSkeleton`.
- **Sidebar collapsible groups:** only one group can be open at a time (state is single string). UX would benefit from a `Set<string>` so admins can keep multiple groups open while jumping between modules.
- **Tables on mobile:** Several managers (JobApplications, Enrollments, Contacts) render desktop-only tables; mobile shows nothing or broken cards. Audit and ensure each has a card fallback.

## Files to modify

| Type | File |
|---|---|
| Bug | `src/pages/Dashboard.tsx` (pass `userRole`, add `videos`/`courses`/`webinars` mappings, drop `max-w-7xl`, default tab per role, replace loader) |
| Refactor | `src/lib/supabaseQuery.ts` (add `sanitizeIlike` helper) |
| Bug | 9 manager files using `.or(...ilike)` — adopt sanitiser |
| Bug | `src/components/dashboard/JobApplicationsManager.tsx` (server-side search) |
| Bug | `src/components/dashboard/PaymentSettingsManager.tsx` (guard removed edge function call) |
| Polish | `src/components/dashboard/AdminSidebar.tsx` (multi-open groups, header sizing) |
| Refactor | `src/components/ProtectedRoute.tsx` (error handling in `useUserRole`) |
| Cleanup | Replace `console.error` with `errorTracking` in dashboard managers (batch pass) |

## Out of scope (flag for later)
- ContentList readiness filter performance (needs DB view)
- Bulk migration of all 38 files' `console.*` calls — propose doing top 10 most-used managers now, rest in a follow-up.

