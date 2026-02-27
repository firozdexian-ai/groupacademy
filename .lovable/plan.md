

# Add Filters + Improve Share Captions in Admin Panel

## Problem

1. **Jobs Manager** only has status filter (All/Active/Inactive) and text search. No way to filter by country/location or by company -- making it hard to find and share jobs for specific regions or employers.

2. **Companies Manager** has no way to see "all jobs for this company" quickly.

3. **Share captions** are hardcoded, repetitive templates like `"Hiring: {title} at {company} - {location} - Apply: {link} #hiring"`. They don't vary between channels and aren't engaging.

## Solution

### 1. Add Location/Country Filter to Jobs Manager

Add a new dropdown filter next to the existing status filter with options extracted from the `location` column:
- "All Locations" (default)
- "Bangladesh" / "Remote" / "Abroad" / specific country names detected from the data
- The filter applies server-side via `.ilike("location", "%filterValue%")` in the existing `loadJobs` query

Also add a **Company filter** dropdown:
- Fetches the list of companies from the `companies` table on mount
- Filters jobs by `company_name` (ilike match)
- Useful for sharing all jobs from a specific employer

### 2. Add "View Jobs" Link in Companies Manager

Add a small button/link on each company row that navigates to the Jobs Manager tab with the company name pre-filled as a filter. This uses the existing `?tab=jobs` query parameter pattern and passes the company name.

### 3. AI-Generated Share Captions (All in English)

Replace the hardcoded share templates with AI-generated, channel-specific captions. When the Share dialog opens:
- Call a new edge function `generate-job-share-caption` that takes the job details + channel name
- Returns an engaging, unique English caption tailored for each platform (LinkedIn = professional tone, Facebook = community tone, WhatsApp = conversational, Telegram = concise)
- Captions include relevant emojis, a call-to-action, and the apply link
- Show a loading skeleton while generating, with a "Regenerate" button for a fresh variation
- Remove the Bangla template entirely (all English as requested)

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/JobsManager.tsx` | Add location filter dropdown + company filter dropdown to the filter bar; pass company filter from URL params |
| `src/components/dashboard/CompaniesManager.tsx` | Add "View Jobs" action button on each row that navigates to jobs tab with company filter |
| `src/components/dashboard/JobsManager.tsx` (ShareJobDialog) | Replace hardcoded templates with AI-generated captions; add loading state and regenerate button; all English |
| `supabase/functions/generate-job-share-caption/index.ts` | **New** -- Takes job details + channel, returns an engaging English caption using gemini-2.5-flash |

## Technical Details

### Location Filter
```text
State: locationFilter (default: "all")
Predefined options: "All", "Bangladesh", "Remote", "International/Abroad"
+ Dynamic: unique locations extracted from a quick distinct query on load

Query modification in loadJobs:
if (locationFilter === "abroad") -> .not("location", "ilike", "%Bangladesh%")
if (locationFilter === "remote") -> .ilike("location", "%remote%")
else -> .ilike("location", `%${locationFilter}%`)
```

### Company Filter
```text
State: companyFilter (default: "all")
Options loaded from companies table (id + name)
Query: .ilike("company_name", selectedCompanyName)
```

### AI Caption Edge Function
Uses gemini-2.5-flash-lite (fast, cheap) with a prompt like:
```text
Write a compelling English social media caption for sharing this job opening on {channel}.
Job: {title} at {company}, Location: {location}, Type: {job_type}
Requirements: {requirements snippet}
Apply link: {link}

Rules:
- Channel-appropriate tone (LinkedIn=professional, Facebook=engaging, WhatsApp=friendly, Telegram=brief)
- Include 2-3 relevant emojis
- Include the apply link naturally
- Under 280 characters for Telegram, under 500 for others
- Make it unique and attention-grabbing, avoid generic "We're hiring" openings
- English only
```

The caption is generated once per channel tab switch and cached in component state so switching back doesn't re-generate. A "Regenerate" button allows getting a fresh variation.

