

# Auto-Approve Job Sharing Gigs via Unique Share Links and Click Tracking

## How It Works (Summary)

Each seeker gets a **unique share link** per job (e.g., `groupacademy.lovable.app/jobs/abc123?ref=talent456`). When anyone clicks that link, the click is tracked and attributed to the seeker. Once the link reaches **10+ clicks**, the gig submission is **automatically approved** and the seeker earns **credits** -- no manual review needed.

## Current State

- Share URL is generic: `/jobs/{jobId}` with no per-user tracking
- `job_analytics` table tracks clicks by `source` (e.g., "facebook", "linkedin") but has no talent attribution
- `track_job_click` RPC inserts into `job_analytics` with `(job_id, source)` only
- Gig submissions require manual admin approval via `award_gig_credits` RPC

## Changes

### 1. Database: Add talent-attributed click tracking

**New table: `job_share_clicks`**
- `id` (UUID, PK)
- `job_id` (UUID, FK to jobs)
- `talent_id` (UUID, FK to talents) -- who shared it
- `ref_code` (text) -- the unique ref param (talent's short ID or hash)
- `clicked_at` (timestamptz, default now)
- `ip_hash` (text, nullable) -- optional dedup per IP

This table is separate from `job_analytics` because it tracks clicks attributed to a specific seeker's share link, while `job_analytics` tracks general traffic sources.

**New RPC: `track_shared_job_click(p_job_id, p_ref_code)`**
- SECURITY DEFINER, public access (anonymous visitors click these links)
- Looks up the talent_id from the ref_code
- Inserts a click record into `job_share_clicks`
- Checks if total clicks for this (talent_id, job_id) pair >= 10
- If threshold met, finds the matching pending `gig_submission` and auto-approves it by calling the credit-awarding logic inline (same as `award_gig_credits` but system-triggered)

**Add `ref_code` column to `talents` table**
- A short, unique, URL-safe identifier per talent (e.g., first 8 chars of their UUID)
- Generated via a trigger on insert, or backfilled for existing talents

### 2. Frontend: Unique share links

**File: `src/components/gigs/JobSharingGigForm.tsx`**
- Change share URL from `/jobs/{jobId}` to `/jobs/{jobId}?ref={talentRefCode}`
- The `ref` param makes every seeker's link unique and trackable
- Fetch the talent's `ref_code` alongside the form data

### 3. Frontend: Track clicks on public job page

**File: `src/pages/PublicJobDetail.tsx`**
- When a `ref` query param is present, call the new `track_shared_job_click` RPC
- Keep existing `source` tracking as-is (they serve different purposes)

### 4. Auto-approval logic (inside the new RPC)

When the click count for a (talent_id, job_id) pair crosses 10:
1. Find the pending `gig_submission` where `submission_data->>'job_id'` matches and `talent_id` matches
2. Update status to `approved`, set `credits_awarded` to the gig's `credit_reward`
3. Credit the talent's balance and earned_balance in `talent_credits`
4. Record in `credit_transactions` with `transaction_type = 'gig_reward'`
5. Increment the gig's `total_completed` counter

This all happens atomically inside the RPC -- no cron job or edge function needed.

### 5. Frontend: Show click progress to seeker

**File: `src/components/gigs/MySubmissions.tsx`**
- For job sharing submissions that are still pending, show a progress indicator: "7/10 clicks"
- Query `job_share_clicks` count for that talent + job combo
- Once auto-approved, it shows "Approved" as usual

## Files Changed

| File | Change |
|------|--------|
| Database migration | Create `job_share_clicks` table, add `ref_code` to talents, create `track_shared_job_click` RPC with auto-approve logic |
| `src/components/gigs/JobSharingGigForm.tsx` | Use `/jobs/{jobId}?ref={refCode}` as the share URL |
| `src/pages/PublicJobDetail.tsx` | Detect `ref` param and call `track_shared_job_click` RPC |
| `src/components/gigs/MySubmissions.tsx` | Show click progress (e.g., "7/10 clicks") for pending job sharing submissions |

## Security Considerations

- `job_share_clicks` has RLS: anon can INSERT (for tracking), authenticated users can SELECT their own clicks
- The auto-approve RPC is SECURITY DEFINER so it can update credits/submissions regardless of caller
- Optional IP-hash dedup prevents a single person from spam-clicking to inflate counts

