

# Jobs Hub Enhancement -- New Browsing Sections

## Overview

Extend the existing Jobs Hub page with four new sections matching the wireframe: **Job by Company**, **Job by Country**, **Promoted/Expiring Soon carousel**, and improved **Job Collection navigation**. No database changes needed -- all data derives from existing `jobs` table columns (`company_name`, `company_logo_url`, `location`, `deadline`, `is_featured`).

## Layout (Section Order)

```text
+---------------------------------------+
| Search Bar (existing)                 |
| Quick Access Pills (existing)         |
| Featured Jobs Carousel (existing)     |
| AI Recommendations (existing)         |
| Browse by Type (existing)             |
+---------------------------------------+
| NEW: Job by Company (horizontal)      |
| [logo+name] [logo+name] [logo+name]  |
+---------------------------------------+
| NEW: Job by Country (horizontal)      |
| [flag+name] [flag+name] [flag+name]   |
+---------------------------------------+
| Recommended for You (existing)        |
+---------------------------------------+
| NEW: Promoted / Expiring Soon         |
| horizontal carousel of JobCards       |
+---------------------------------------+
| Recent Applications (existing)        |
+---------------------------------------+
```

## File Changes

### 1. Update `src/pages/app/JobsHub.tsx`

Add three new sections and one new data fetch. All inserted between existing sections.

**New state:**
- `companies`: top 8 companies with logo and job count (aggregated via a single query using `company_name, company_logo_url`)
- `countries`: top 8 distinct locations with job count
- `promotedJobs`: jobs that are featured OR have deadline within 7 days, ordered by deadline ascending (most urgent first), limit 8

**New data fetching (inside `loadAllData`):**
- `fetchTopCompanies()`: Query `jobs` table with group-by logic. Since Supabase JS doesn't support GROUP BY, we'll fetch active jobs selecting `company_name, company_logo_url` and aggregate in JS (using a Map to count + dedupe). Take top 8 by count.
- `fetchTopCountries()`: Similar approach -- fetch `location` column from active jobs, extract country part (after last comma or full string), aggregate in JS. Take top 8.
- `fetchPromotedJobs()`: Query featured jobs UNION jobs with deadline within next 7 days, ordered by deadline asc, limit 8. Uses the existing `JobCardData` type.

**New UI sections:**

**(a) Job by Company** -- Horizontal scroll of circular logo avatars with company name and job count underneath. Clicking navigates to `/app/jobs/all?company=CompanyName`.

```text
[ (logo)   ]  [ (logo)   ]  [ (logo)   ]
  Hilton       PwC India     Canonical
  21 jobs      41 jobs       27 jobs
```

**(b) Job by Country** -- Horizontal scroll of rounded-rectangle cards showing country/city name with job count. Clicking navigates to `/app/jobs/all?location=LocationName`.

```text
[ Dhaka, BD    ]  [ Dubai, UAE   ]  [ Singapore   ]
  351 jobs          284 jobs          76 jobs
```

**(c) Promoted / Expiring Soon** -- Horizontal carousel using existing `JobCard` with `default` variant at 260px width (same pattern as Featured Jobs). Section header shows a flame/fire icon. Jobs with urgent deadlines get the existing red "Closing soon" badge automatically from `JobCard`.

### 2. No other file changes needed

All new sections use existing components (`SectionHeader`, `JobCard`, `ScrollArea`, `Card`, `Badge`) and existing navigation patterns (`/app/jobs/all?param=value`). The `/app/jobs/all` page already handles `search`, `type` query params -- we'll pass `company` and `location` params that the AppJobs page will need to handle (noted as future work or handled if the page already supports filtering).

## Technical Notes

- Company aggregation: Fetch up to 500 active jobs selecting only `company_name, company_logo_url`, then use a JS `Map` to aggregate counts. This avoids needing a database function.
- Country extraction: Parse the `location` string (e.g., "Dubai, United Arab Emirates") -- use full location string for filtering, display truncated for UI.
- Promoted jobs query: `is_featured = true OR (deadline between NOW and NOW+7days)`, active only, limit 8.
- All new fetches run in parallel with existing ones via `Promise.all`.
- Icons: `Building2` for companies, `Globe` for countries, `Flame` for promoted section.

