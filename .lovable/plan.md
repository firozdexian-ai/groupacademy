

# Fix and Enhance Job Sharing Gig Filters

## Problems Found

1. **Only 100 jobs fetched** -- The query has `.limit(100)` but there are 2,600+ active jobs, so most jobs are invisible regardless of filters
2. **Location filter too basic** -- Only 4 hardcoded options (All, Bangladesh, Remote, International) with simple string matching that misses many variations (e.g., "Banani, Dhaka" won't match "Bangladesh")
3. **No job type filter** -- Seekers can't filter by full-time, part-time, remote, contract, or internship
4. **No country-level filtering** -- Seekers targeting specific audiences (e.g., UAE, India, Singapore) can't narrow down

## Solution

### 1. Remove the 100-job limit
Fetch all active jobs with valid deadlines. With proper client-side filtering, the list stays manageable.

### 2. Replace location filters with a country dropdown
Extract unique countries from job locations dynamically and present them in a scrollable select dropdown. Include presets like "All", "Bangladesh", and "International" at the top, followed by all detected countries sorted by job count.

Country detection will use the same alias-matching logic already proven in the admin Jobs Manager (matching city names to countries, e.g., "Dubai" to UAE, "Dhaka" to Bangladesh).

### 3. Add job type filter chips
Add a row of filter chips for job types: All, Full-time, Part-time, Remote, Contract, Internship -- using the existing `JOB_TYPES` constants from `src/lib/constants/jobTypes.ts`.

### 4. Combined filtering
Both filters work together -- e.g., "UAE + Remote" shows only remote jobs in UAE.

## Technical Details

| File | Change |
|------|--------|
| `src/components/gigs/JobSharingGigForm.tsx` | Remove `.limit(100)`, add country dropdown + job type chips, rewrite filter logic |

**Country matching approach**: Build a map of country keywords (including city aliases like Dubai->UAE, Dhaka->Bangladesh). Extract the country from each job's location field. Populate the dropdown dynamically from detected countries with job counts shown.

**Job type filter**: Import `JOB_TYPES` from `src/lib/constants/jobTypes.ts`. Add a chip row similar to the existing location filter row, defaulting to "All".

**UI layout**: Search bar on top, then a row with the country Select dropdown and job type chips side by side, then the job list below.

