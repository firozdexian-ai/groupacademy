

# Replace "International" Blob with Per-Country Filter

## Problem
The current location filter has only 3 options: Bangladesh, Remote, International. "International" dumps 2,000+ jobs from 15+ countries into one list, making it impossible to share jobs for a specific country like UAE, India, or Canada.

## Solution
Replace the location filter dropdown with a searchable list of actual countries derived from job data, plus keep "Bangladesh", "Remote", and "All" as top-level options.

## How It Works

### 1. Dynamic Country Extraction
On component load, run a query that extracts unique countries from the `location` column using pattern matching against the known countries list (from `src/lib/constants/countries.ts`). This produces a list like:

- India (488 jobs)
- UAE (459)
- Bangladesh (442)
- United States (155)
- United Kingdom (93)
- Australia (90)
- Canada (87)
- Germany (84)
- Japan (83)
- Singapore (76)
- Ireland (72)
- New Zealand (57)
- France, Saudi Arabia, Netherlands (40-50 each)
- ...and more

### 2. Updated Filter Dropdown
Replace the current 4-option Select with a wider, scrollable dropdown:

```
All Locations
---
Bangladesh
Remote
All International (non-Bangladesh)
---
India (488)
UAE (459)
United States (155)
United Kingdom (93)
Australia (90)
Canada (87)
...
```

- Top section: Quick presets (Bangladesh, Remote, All International)
- Bottom section: Individual countries sorted by job count (descending)
- Each country shows its job count as a badge for quick context
- The dropdown uses a Command/Combobox pattern with search so you can type "Canada" to jump to it

### 3. Filter Query Logic
When a specific country is selected (e.g., "Canada"):
```
query.ilike("location", "%Canada%")
```

This matches "Toronto, Canada", "Alberta, Canada", etc. -- works with the existing location format.

### 4. Country Detection Approach
Rather than a complex DB function, we do a simple client-side extraction:
- Fetch distinct locations from jobs table
- Match each against the COUNTRIES list from `countries.ts`
- Count occurrences per country
- Sort by count descending

This is done once on mount and cached in state.

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/JobsManager.tsx` | Replace location filter Select with a searchable Combobox/Command showing individual countries with counts; update filter logic to support per-country filtering |

## Technical Notes

- Uses the existing `cmdk` (Command) component already installed for the searchable dropdown
- Country list is derived dynamically from actual job data, so it automatically reflects whatever countries exist
- Falls back to the COUNTRIES constant for display names and flag emojis
- No database changes needed -- purely a frontend filter improvement
