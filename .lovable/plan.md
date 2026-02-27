
# Jobs Hygiene Cleanup + External Apply Tracking

## Problem 1: Duplicate Jobs (393 duplicates found)

**Root cause**: The dedup check uses `source_url` (LinkedIn URL), but LinkedIn creates multiple URLs for the same job posting. Same role at the same company gets imported multiple times with different LinkedIn URLs.

**Fix -- two parts**:

### A. Clean up existing duplicates (one-time database cleanup)
- Write a migration that keeps only the newest row per `title + company_name` combo, deleting older duplicates
- This will remove ~393 duplicate rows safely
- Only deletes jobs that have no associated applications

### B. Strengthen dedup in future imports
- In `BatchLinkedInJobUpload.tsx`, add a secondary dedup check: besides `source_url`, also check for existing jobs with the same `title + company_name` (case-insensitive)
- Mark these as duplicates in the preview table so admins can see them before importing

## Problem 2: Zero Tracking on "Apply Externally" Clicks

**Current state**: 2,640 jobs use external links. When users click "Apply Externally", `window.open()` fires with no tracking. You have zero visibility on application intent for these jobs.

**Solution -- Create an "External Apply Click" tracking system**:

### A. New database table: `job_apply_clicks`
```text
id (uuid), job_id (uuid), talent_id (uuid nullable), clicked_at (timestamp), source (text)
```
This captures every "Apply Externally" click, tied to the job and optionally the logged-in user.

### B. Track clicks in `AppJobDetail.tsx` and `PublicJobDetail.tsx`
- Before calling `window.open()`, insert a row into `job_apply_clicks`
- For logged-in users: capture `talent_id`
- For public page: anonymous click (talent_id = null)

### C. Show apply click counts in admin dashboard
- In `JobsManager.tsx`, add an "Apply Clicks" column next to the existing "Shared" column
- Query `job_apply_clicks` grouped by `job_id` alongside the share logs fetch
- Display the count per job so admins can see engagement

### D. Add to KPI Dashboard
- In `JobsKPIDashboard.tsx`, add a "Total Apply Clicks" KPI card showing total external apply clicks (last 30 days)
- This gives a quick pulse on how many people are actually trying to apply

## Technical Summary

| File / Area | Change |
|---|---|
| Database migration | Create `job_apply_clicks` table with RLS; deduplicate existing jobs |
| `BatchLinkedInJobUpload.tsx` | Add title+company dedup check alongside source_url check |
| `AppJobDetail.tsx` | Track click before `window.open()` in `handleApply` |
| `PublicJobDetail.tsx` | Same tracking for public job page |
| `JobsManager.tsx` | Add "Apply Clicks" column fetched per page |
| `JobsKPIDashboard.tsx` | Add "Apply Clicks" KPI card |
