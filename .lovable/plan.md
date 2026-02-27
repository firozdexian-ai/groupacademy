

# Fix and Improve the Job Posting Gig

## Root Cause of the Error

The frontend sends `{ rawText: jobText }` but the edge function reads `{ jobPostText }` -- a **field name mismatch**. This means the edge function always receives `undefined` for the job text and returns a 400 error ("Please provide job post text").

## Changes

### 1. Fix the field name mismatch (edge function)
**File:** `supabase/functions/parse-job-post/index.ts`

Change line 238 to accept both field names for backward compatibility:
```
const { jobPostText, rawText } = await req.json();
const text = jobPostText || rawText;
```
Then use `text` for the rest of the function. This ensures both the gig form and any other callers (like the admin dashboard) continue to work.

### 2. Add ability to edit parsed fields before submitting
**File:** `src/components/gigs/JobPostingGigForm.tsx`

Currently the parsed preview is read-only. If the AI parses something incorrectly, the seeker is stuck. Add inline editing:
- Make the Title, Company, Location, and Job Type fields editable `Input` fields instead of plain text
- Pre-fill them from the parsed data
- Allow the seeker to correct mistakes before submitting
- Add a "Re-parse" button so they can try again with edited text

### 3. Better error handling and UX feedback
**File:** `src/components/gigs/JobPostingGigForm.tsx`

- Show a clear error state when parsing fails (not just a toast that disappears)
- Add a character count indicator near the textarea so seekers know the 20-char minimum
- Disable the submit button if required parsed fields (title, company) are empty/dashes

### 4. Show job posting details in MySubmissions
**File:** `src/components/gigs/MySubmissions.tsx`

For `job_posting` category submissions (not just `job_sharing`), display the parsed job title and company from `submission_data.parsed_job` so seekers can identify which job they submitted.

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/parse-job-post/index.ts` | Accept both `rawText` and `jobPostText` field names |
| `src/components/gigs/JobPostingGigForm.tsx` | Editable parsed fields, re-parse button, better error states, char count |
| `src/components/gigs/MySubmissions.tsx` | Show parsed job title/company for `job_posting` submissions |

