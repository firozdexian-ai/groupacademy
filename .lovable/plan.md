
# Wire Up "Get AI Recommendations" to Show Top Matching Jobs

## Current Problem

The "Get AI Recommendations" button (10 credits) deducts credits and navigates to `/app/jobs/all?ai=true`, but the `AppJobs` page completely ignores the `ai` query parameter. Users pay 10 credits and see the same generic "All Jobs" list.

## Solution

Create a new edge function that uses AI to rank jobs against the talent's profile, and display the results inline on the Jobs Hub page (no navigation away) in a dedicated "AI Recommended" section that appears after clicking the button.

## Changes

### 1. New Edge Function: `suggest-jobs-for-talent`

A new backend function that:
- Fetches the talent's skills, experience, education, CV text, and profession
- Fetches up to 50 active jobs (title, company, requirements, preferred_skills, job_type, location, experience_level)
- Sends both to the AI gateway (gemini-2.5-flash) asking it to return the top 10 most relevant job IDs with match scores and a one-line reason
- Returns a ranked list: `[{ job_id, match_score, reason }]`

This approach uses AI to do intelligent matching (understanding transferable skills, context, seniority fit) rather than simple keyword overlap.

### 2. Update `JobsHub.tsx` -- Show Results Inline

Instead of navigating away to `/app/jobs/all?ai=true`:
- After credit deduction, call the new edge function
- Display results in a new "AI Recommended for You" section that appears right below the button
- Show up to 10 job cards (compact variant) with match score badges and the AI's one-line reason
- Each card is clickable and navigates to the job detail page
- Add a loading skeleton state while AI processes

Remove the navigation to `/app/jobs/all?ai=true` entirely.

### 3. Update `JobCard.tsx` -- Optional Match Info

Add an optional `matchInfo` prop to `JobCard`:
- Displays a small match percentage badge and the AI reason line below the job title
- Only shown when the prop is passed (no visual change for regular job cards)

## Technical Detail

### Edge Function Prompt Strategy

```text
System: You are a job matching expert. Given a candidate profile and a list of jobs,
return the top 10 most relevant jobs ranked by fit.

Return JSON array: [{ job_id: string, match_score: number (0-100), reason: string }]

Consider: skill overlap, experience level fit, industry relevance, transferable skills.
Be selective -- only include genuinely relevant jobs.
```

The function sends job data as a compact summary (id + title + company + requirements) to stay within token limits. Uses `google/gemini-2.5-flash` for speed and cost efficiency.

### UI Flow

1. User taps "Get AI Recommendations" (10 credits)
2. Button shows loading spinner
3. Edge function runs (~3-5 seconds)
4. A new "AI Recommended for You" section slides in below the button with up to 10 compact job cards
5. Each card shows: job title, company, match score badge (e.g., "92% match"), and a one-line AI reason
6. Section persists until page reload

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/suggest-jobs-for-talent/index.ts` | **New** -- AI-powered job ranking edge function |
| `src/pages/app/JobsHub.tsx` | Replace navigation with inline edge function call; render AI results section |
| `src/components/jobs/JobCard.tsx` | Add optional `matchInfo` prop for score badge + reason text |
