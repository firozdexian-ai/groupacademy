

# Fix MySubmissions Display and Improve Click Tracking

## Problems Found

**1. "Spread the Word" instead of job name**
The MySubmissions component shows `sub.gigs?.title` (the gig template name like "Spread the Word") instead of the actual job title. The job title IS already saved in `submission_data.job_title` -- it just isn't displayed.

**2. Click tracking only works on the public job page**
The `ref` param tracking is only implemented in `PublicJobDetail.tsx` (`/jobs/:id`). If someone clicks the share link and is already logged in, they may land on `AppJobDetail.tsx` (`/app/jobs/:id`) where no tracking happens. Also need to add tracking to the in-app job detail page so clicks from logged-in users also count.

## Changes

### 1. `src/components/gigs/MySubmissions.tsx` -- Show job details for job sharing submissions

- For job_sharing submissions, display the job title and company from `submission_data` instead of the generic gig title
- Show format: **"Company Name -- Job Title"** as the card heading
- Keep the gig title ("Spread the Word") as a small secondary label so it's clear which gig type it is
- Show the number of channels shared on (from `submission_data.channels_shared`)

### 2. `src/pages/app/AppJobDetail.tsx` -- Add ref click tracking

- Read the `ref` search param on page load
- Call `track_shared_job_click` RPC just like `PublicJobDetail.tsx` does
- This ensures clicks from logged-in users also count toward the 10-click threshold

### 3. `src/pages/PublicJobDetail.tsx` -- Minor fix

- Clean up the `ref` param from the URL after tracking (like it already does for `source`) to prevent duplicate tracking on page refresh

## Files Changed

| File | Change |
|------|--------|
| `src/components/gigs/MySubmissions.tsx` | Show job title/company from submission_data for job sharing gigs |
| `src/pages/app/AppJobDetail.tsx` | Add `ref` param detection and `track_shared_job_click` call |
| `src/pages/PublicJobDetail.tsx` | Clean `ref` param from URL after tracking |

