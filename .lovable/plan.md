
# Study & Career Abroad - Remaining Improvements Implementation Plan

## Overview
This plan addresses the remaining audit findings from the Study and Career Abroad feature audit, focusing on code quality, consistency, and UX improvements.

---

## Changes Summary

### 1. Standardize Country Codes (Use Centralized Constants)

**Problem**: Country lists are duplicated in 3 places with inconsistencies:
- `CareerAbroad.tsx` uses inline `COUNTRIES` array with "UK" code
- `StudyAbroad.tsx` uses inline `COUNTRIES` array with "UK" code  
- `lib/constants/countries.ts` already has both "UK" AND "GB" entries for United Kingdom

**Solution**: Replace inline arrays in both pages with the centralized `COUNTRIES` import from `lib/constants/countries.ts`.

**Files to modify**:
- `src/pages/app/CareerAbroad.tsx` - Remove inline COUNTRIES, import from constants
- `src/pages/app/StudyAbroad.tsx` - Remove inline COUNTRIES, import from constants

---

### 2. Add Jobs Abroad Location Filter

**Problem**: The "Jobs Abroad" card links to `/app/jobs?location=abroad` but `AppJobs.tsx` doesn't parse or handle this query parameter.

**Solution**: Add location filter parsing to `AppJobs.tsx`:
- Parse `location` from URL search params
- Add `is_international` toggle in filter panel
- Filter jobs where location contains "abroad", "international", "overseas", or is explicitly remote with non-BD country

**Files to modify**:
- `src/pages/app/AppJobs.tsx` - Add location filter state and parsing

---

### 3. Update Study Abroad Advisor Link

**Problem**: The "Chat with Counselor" button in `StudyAbroadDetail.tsx` links to `/app/agents/career-consultant` instead of the newly created `/app/agents/study-abroad-advisor`.

**Solution**: Update the navigation target to use the specialized Study Abroad Advisor agent.

**Files to modify**:
- `src/pages/app/StudyAbroadDetail.tsx` - Change agent route

---

### 4. Add Missing Route Constants

**Problem**: `lib/routes.ts` only has `/app/abroad` but missing sub-routes for consistency.

**Solution**: Add the following routes:
- `abroadStudy: '/app/abroad/study'`
- `abroadIelts: '/app/abroad/ielts'`
- `abroadStudyDetail: (id: string) => /app/abroad/study/${id}`

**Files to modify**:
- `src/lib/routes.ts` - Add abroad sub-routes

---

## Detailed Technical Implementation

### File 1: `src/pages/app/CareerAbroad.tsx`

**Changes**:
1. Import `COUNTRIES` from `@/lib/constants/countries` instead of inline array
2. Create a filtered subset for "Popular Destinations" display (9-10 countries)
3. Use the `getCountryFlag` helper for consistent flag lookups

```typescript
// Remove lines 6-16 (inline COUNTRIES array)
// Add import
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";

// Create popular destinations filter
const POPULAR_DESTINATIONS = COUNTRIES.filter(c => 
  ["US", "UK", "GB", "CA", "AU", "DE", "SG", "JP", "SE", "NL"].includes(c.code)
).filter((c, i, arr) => 
  // Dedupe UK/GB - keep only UK for display
  c.code !== "GB" || !arr.some(x => x.code === "UK")
);
```

### File 2: `src/pages/app/StudyAbroad.tsx`

**Changes**:
1. Import `COUNTRIES` from `@/lib/constants/countries`
2. Remove inline COUNTRIES array (lines 14-25)
3. Create filtered list for dropdown including Malaysia

```typescript
// Remove lines 14-25 (inline COUNTRIES array)
// Add import
import { COUNTRIES } from "@/lib/constants/countries";

// Filter for study abroad popular countries
const STUDY_COUNTRIES = COUNTRIES.filter(c =>
  ["US", "UK", "GB", "CA", "AU", "DE", "SG", "JP", "SE", "NL", "MY"].includes(c.code)
).filter((c, i, arr) => c.code !== "GB" || !arr.some(x => x.code === "UK"));
```

### File 3: `src/pages/app/AppJobs.tsx`

**Changes**:
1. Parse `location` query param from URL
2. Add "International Opportunities" toggle in filters
3. Apply filter logic for international jobs

```typescript
// Add state for location filter
const [isInternational, setIsInternational] = useState(
  searchParams.get("location") === "abroad"
);

// Add to filter logic
const matchLocation = !isInternational || 
  (job.location?.toLowerCase().includes("remote") ||
   job.location?.toLowerCase().includes("international") ||
   job.location?.toLowerCase().includes("abroad") ||
   job.location?.toLowerCase().includes("overseas") ||
   job.job_type === "remote");
```

### File 4: `src/pages/app/StudyAbroadDetail.tsx`

**Changes**:
1. Update counselor button to link to study-abroad-advisor

```typescript
// Line 241: Change from
onClick={() => navigate("/app/agents/career-consultant")}
// To
onClick={() => navigate("/app/agents/study-abroad-advisor")}
```

### File 5: `src/lib/routes.ts`

**Changes**:
1. Add abroad sub-routes under the `app` section

```typescript
// In app section, after line 73
abroad: '/app/abroad',
abroadStudy: '/app/abroad/study',
abroadStudyDetail: (id: string) => `/app/abroad/study/${id}`,
abroadIelts: '/app/abroad/ielts',
```

---

## Implementation Order

| Step | File | Change | Impact |
|------|------|--------|--------|
| 1 | `routes.ts` | Add abroad sub-routes | Low risk - constants only |
| 2 | `CareerAbroad.tsx` | Use centralized COUNTRIES | Medium - refactor imports |
| 3 | `StudyAbroad.tsx` | Use centralized COUNTRIES | Medium - refactor imports |
| 4 | `StudyAbroadDetail.tsx` | Update advisor link | Low - single line change |
| 5 | `AppJobs.tsx` | Add location filter | Medium - new feature |

---

## Expected Outcomes

| Issue | Before | After |
|-------|--------|-------|
| Country flags | May fail for "UK" code | Consistent flag lookup |
| Code duplication | 3 COUNTRIES arrays | 1 centralized source |
| Jobs Abroad link | Leads to unfiltered page | Applies "international" filter |
| Study counselor | Generic career agent | Specialized study abroad advisor |
| Route consistency | Missing sub-routes | Full abroad route tree |

---

## Testing Checklist

- [ ] Navigate to `/app/abroad` and verify country flags display correctly
- [ ] Click on a country in Popular Destinations grid and verify filter works
- [ ] Navigate to `/app/abroad/study` and verify country dropdown shows flags
- [ ] Click "Jobs Abroad" card and verify international filter is active
- [ ] Open a Study Abroad program detail and click "Chat with Counselor" - should open Study Abroad Advisor
- [ ] Verify no console errors related to missing countries or routes

