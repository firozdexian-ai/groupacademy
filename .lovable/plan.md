

# Lead Hunter — AI-Powered JD Parsing for New Hunt

## What You Asked For
Replace the manual Job Title + Company + Description fields with a single "Paste JD" textarea, then use AI to auto-extract the title, company, and description.

## Plan

### Simplify the New Hunt Dialog

**Current flow:** 3 fields (Job Title, Company, Job Description) + leads count → Submit

**New flow:**
1. Single large textarea: "Paste the full Job Description here"
2. A "Parse with AI" button that calls the existing `parse-job-post` edge function
3. After parsing, show extracted fields (Job Title, Company Name, Description) as editable inputs so admin can review/correct
4. Then "Find Matches" submits as before

### Implementation Details

- Reuse the existing `parse-job-post` edge function (no backend changes needed) — it already extracts title, company_name, description from raw JD text
- Add a `isParsing` state and a `parsed` flag to track the two-step flow
- After successful parse, populate `jobTitle`, `companyName`, `jobDescription` from the AI response
- Admin can edit any field before starting the hunt
- Add a "Reset" button to go back to the paste step
- Keep the `leadsRequested` number field in the review step

### File Changes

| File | Change |
|------|--------|
| `src/components/dashboard/LeadHunterManager.tsx` | Rework New Hunt dialog: single paste textarea → AI parse → editable review fields → submit |

No database or edge function changes needed.

