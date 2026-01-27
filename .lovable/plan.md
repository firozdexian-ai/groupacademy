

# Platform Improvement Plan: Critical Bug Fix + Abroad Section Validation

## Summary

After comprehensive audit of all AI services and the abroad section:
- **AI Services**: All 20 edge functions are properly implemented with security, error handling, and fallbacks
- **Abroad Section**: All pages work correctly (CareerAbroad, StudyAbroad, StudyAbroadDetail, IELTSPrep)
- **Critical Bug**: Found broken job save functionality in `AppJobDetail.tsx`

---

## Phase 1: Fix Critical `saved_jobs` Bug (Immediate)

### Problem
`AppJobDetail.tsx` references a non-existent `saved_jobs` table. Database only has `saved_items` table.

### Files to Modify

**File: `src/pages/app/AppJobDetail.tsx`**

1. Add import for useSavedItems hook
2. Replace direct Supabase calls with hook usage
3. Remove `as any` type casting (clean code)

### Implementation

```typescript
// Add import
import { useSavedItems } from '@/hooks/useSavedItems';

// In component, replace useState + manual Supabase logic:
const { isSaved: checkIsSaved, toggleSave } = useSavedItems();

// Remove the broken loadJobAndApplication saved_jobs check (lines 155-162)
// Remove the broken handleSaveToggle function (lines 172-189)

// Use hook methods instead:
const jobIsSaved = id ? checkIsSaved(id, 'job') : false;

const handleSaveToggle = async () => {
  if (!id) return;
  await toggleSave(id, 'job');
};
```

---

## Phase 2: Abroad Section Data Seeding (Optional Enhancement)

### Current Data Status
- `study_abroad_programs`: 6 active programs
- `ielts_resources`: 8 active resources

The abroad section works perfectly but could benefit from more content:

### Suggested Content Additions (Admin Dashboard)
1. Add more Study Abroad programs for popular destinations (UK, US, Canada, Australia)
2. Add more IELTS resources per section (Listening, Reading, Writing, Speaking)
3. Consider adding AI-powered IELTS speaking practice via the IELTS Tutor agent

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/app/AppJobDetail.tsx` | Refactor to use `useSavedItems` hook instead of broken direct queries |

### No Changes Needed

| Component | Status |
|-----------|--------|
| All 20 Edge Functions | Working correctly with proper auth, error handling, fallbacks |
| CareerAbroad.tsx | Working correctly |
| StudyAbroad.tsx | Working correctly - filters, search, debouncing |
| StudyAbroadDetail.tsx | Working correctly - UUID validation, error states |
| IELTSPrep.tsx | Working correctly - section tabs, resource display |
| useSavedItems.ts | Working correctly - uses correct `saved_items` table |

---

## What Was Verified

### AI Services (All 20 Functions)
- Authentication with Authorization header
- User ownership verification (IDOR prevention)
- Rate limit handling (429/402)
- 90-second timeout controllers
- JSON parsing with markdown cleanup
- Fallback responses when AI fails

### Abroad Section Pages
- Database queries work correctly
- Filters and search functionality operational
- Error states properly displayed
- Navigation between pages works
- Country selection and filtering work

### Database Tables
- `saved_items` table exists and is used by `useSavedItems` hook
- `saved_jobs` table does NOT exist (bug confirmed)
- `study_abroad_programs` has 6 active records
- `ielts_resources` has 8 active records

---

## Expected Outcome

After implementing Phase 1:
- Job save/unsave functionality will work correctly
- Users can bookmark jobs from the job detail page
- Saved jobs will appear in the Saved Items page
- No more silent failures when saving jobs

