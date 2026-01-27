

# Career Assessment Scorecard - Comprehensive Audit & Improvement Plan

## Overview

I've conducted a thorough analysis of the Career Assessment Scorecard feature across both the Seeker (user-facing) and Admin platforms. This audit covers the complete user journey, database schema, edge functions, UI/UX, and identifies bugs, inconsistencies, and improvement opportunities.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SEEKER JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entry Points:                                                              │
│  ┌───────────────────────┐     ┌───────────────────────┐                   │
│  │ /career-assessment    │     │ /app/services/        │                   │
│  │ (Public + AuthGate)   │     │ assessment (App)      │                   │
│  └───────────┬───────────┘     └───────────┬───────────┘                   │
│              │                             │                                │
│              ▼                             ▼                                │
│  ┌───────────────────────────────────────────────────────────────┐         │
│  │                     SHARED COMPONENTS                         │         │
│  │  • ProfessionSelector → AssessmentStepper → LeadCaptureForm   │         │
│  └───────────────────────────────────────────────────────────────┘         │
│              │                                                              │
│              ▼                                                              │
│  ┌───────────────────────────────────────────────────────────────┐         │
│  │              Edge Function: analyze-career-assessment          │         │
│  │              (AI Analysis via Lovable Gateway)                 │         │
│  └───────────────────────────────────────────────────────────────┘         │
│              │                                                              │
│              ▼                                                              │
│  ┌───────────────────────────────────────────────────────────────┐         │
│  │              /assessment-results/:id                           │         │
│  │              (Results Page + PDF Download)                     │         │
│  └───────────────────────────────────────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          ADMIN DASHBOARD                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • AssessmentLeadsManager - View all submissions, filter, export CSV        │
│  • AssessmentCodeGenerator - Generate paid retake codes per lead            │
│  • StandaloneAssessmentCodeGenerator - Bulk code generation                 │
│  • ServiceOutreachManager - Trackable share links                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Issues Identified

### CRITICAL BUGS

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Duplicate Credit Deduction** | `LeadCaptureForm.tsx:167-169` vs `AppCareerAssessment.tsx:161-164` | Credits deducted TWICE when using App flow - once in LeadCaptureForm and again in AppCareerAssessment |
| 2 | **Edge Function Ownership Check Too Strict** | `analyze-career-assessment:83` | Assessment created by non-logged-in user (public path) cannot trigger AI analysis because `user_id` won't match |
| 3 | **Public Path vs App Path Inconsistency** | CareerAssessment.tsx vs AppCareerAssessment.tsx | Different flows for same feature - public has email check + cooldown, app doesn't |

### HIGH PRIORITY ISSUES

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 4 | **No Pagination** | `AssessmentLeadsManager.tsx:56-74` | Fetches ALL assessments - will cause performance issues at scale |
| 5 | **PDF Template Rendering Issues** | `ScorecardPDFTemplate.tsx` | Template uses Inter/Poppins fonts that may not render in PDF; positioned off-screen causes issues on some browsers |
| 6 | **Results Query Uses email ILIKE** | `MyResults.tsx:47-51` | Case-insensitive match on email can return incorrect results if email has different casing |
| 7 | **Missing Loading States** | `CareerAssessment.tsx:449-455` | ProfessionSelector shows before categories are loaded, causing flash of empty state |

### MEDIUM PRIORITY UI/UX IMPROVEMENTS

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| 8 | **No Progress Persistence** | `AssessmentStepper.tsx` | User loses progress if they refresh mid-assessment |
| 9 | **Phone Input Inconsistency** | `LeadCaptureForm.tsx:266-275` | Uses basic Input instead of PhoneInput component with country selector |
| 10 | **Cooldown Period Hardcoded** | `CareerAssessment.tsx:153-159` | 90-day cooldown not clearly communicated; uses database `expires_at` |
| 11 | **Missing Service History Link** | Results page | No navigation to /app/my-results from assessment results |
| 12 | **PDF Download UX** | `AssessmentResults.tsx:256-269` | No preview of PDF before download; users don't know what they'll get |

### LOW PRIORITY ENHANCEMENTS

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| 13 | **No Question Bank Management** | Admin Dashboard | No UI for admins to add/edit/manage assessment questions |
| 14 | **No A/B Testing Support** | Assessment flow | No ability to test different question sets |
| 15 | **No Retake Comparison** | Results page | When user retakes, no side-by-side comparison with previous score |

---

## Detailed Fix Plan

### Phase 1: Critical Bug Fixes

#### 1.1 Fix Duplicate Credit Deduction

**Problem**: In the App flow (`AppCareerAssessment.tsx`), credits are deducted during processing (lines 161-164). But `LeadCaptureForm.tsx` ALSO deducts credits (lines 167-169). This means app users pay twice.

**Files to Modify**:
- `src/components/assessment/LeadCaptureForm.tsx`

**Changes**:
Remove credit deduction from LeadCaptureForm since it's already handled in the parent (AppCareerAssessment). LeadCaptureForm should only handle data collection and validation.

```typescript
// REMOVE these lines from LeadCaptureForm.tsx (around line 167-169):
// await addServiceUsed('career_assessment');
// await deductCredits('CAREER_ASSESSMENT', tempAssessmentId, 'Career Readiness Scorecard');
```

#### 1.2 Fix Edge Function Ownership Check

**Problem**: The edge function checks `assessment.user_id !== user.id`, but assessments created through the public path may have `user_id = null` initially, or the `user_id` might be set during insert but the edge function call happens with a different user context.

**Files to Modify**:
- `supabase/functions/analyze-career-assessment/index.ts`

**Changes**:
Allow analysis if user owns the assessment via `user_id` OR `talent_id`, or if they're an admin:

```typescript
// Replace lines 80-89 with:
const isOwner = assessment.user_id === user.id || assessment.talent_id === talentId;
const isAdmin = await checkIsAdmin(supabaseAuth, user.id); // helper function

if (!isOwner && !isAdmin) {
  console.error(`Unauthorized access attempt`);
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, ... });
}
```

Also need to fetch the user's `talent_id` first:
```typescript
const { data: talent } = await supabaseAuth
  .from('talents')
  .select('id')
  .eq('user_id', user.id)
  .maybeSingle();
const talentId = talent?.id;
```

#### 1.3 Align Public and App Assessment Flows

**Problem**: Public path (`CareerAssessment.tsx`) has:
- Email check step
- Cooldown detection with access code bypass
- 7-step flow

App path (`AppCareerAssessment.tsx`) has:
- No email check (uses logged-in user)
- No cooldown detection
- 5-step flow

**Decision Required**: Should app users also have cooldown periods, or is the credit system sufficient?

**Recommended Changes**:
- Keep flows separate but add cooldown check to App flow as well
- Add a "View Previous Results" link if user has recent assessment

---

### Phase 2: High Priority Fixes

#### 2.1 Add Pagination to Admin Leads Manager

**Files to Modify**:
- `src/components/dashboard/AssessmentLeadsManager.tsx`

**Changes**:
Add pagination with 20 items per page using Supabase's `.range()`:

```typescript
const [page, setPage] = useState(0);
const PAGE_SIZE = 20;

// In loadLeads():
const { data, error, count } = await supabase
  .from("career_assessments")
  .select(`...`, { count: 'exact' })
  .order("created_at", { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

#### 2.2 Improve PDF Template Reliability

**Files to Modify**:
- `src/components/assessment/ScorecardPDFTemplate.tsx`
- `src/lib/assessmentPdfGenerator.ts`

**Changes**:
1. Use system fonts that are guaranteed to render
2. Add a PDF preview modal before download
3. Consider using a server-side PDF generation approach for better reliability

```typescript
// Update font-family to system fonts only:
fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
```

#### 2.3 Fix Email Case Sensitivity in MyResults

**Files to Modify**:
- `src/pages/app/MyResults.tsx`

**Changes**:
Use `.eq('email', talent.email.toLowerCase())` instead of `.ilike()`:

```typescript
// Line 48-51: Change to use exact lowercase match
.eq('email', talent.email.toLowerCase().trim())
```

---

### Phase 3: UX Improvements

#### 3.1 Replace Phone Input with PhoneInput Component

**Files to Modify**:
- `src/components/assessment/LeadCaptureForm.tsx`

**Changes**:
Replace the basic Input with the PhoneInput component that's already used elsewhere:

```tsx
import { PhoneInput } from '@/components/ui/phone-input';

// Replace lines 266-275 with:
<div className="space-y-2">
  <Label>Phone Number *</Label>
  <PhoneInput
    value={formData.phone}
    onChange={(phone, countryCode, country) => {
      setFormData({ ...formData, phone, countryCode, country });
    }}
    defaultCountry="BD"
    disabled={submitting}
  />
</div>
```

Also update the form state to include countryCode and country.

#### 3.2 Add Progress Persistence (Optional)

**Files to Modify**:
- `src/components/assessment/AssessmentStepper.tsx`

**Changes**:
Store answers in localStorage keyed by categoryId, clear on completion:

```typescript
useEffect(() => {
  const saved = localStorage.getItem(`assessment_${categoryId}`);
  if (saved) {
    const { answers: savedAnswers, index } = JSON.parse(saved);
    setAnswers(savedAnswers);
    setCurrentIndex(index);
  }
}, [categoryId]);

// On answer change:
useEffect(() => {
  if (Object.keys(answers).length > 0) {
    localStorage.setItem(`assessment_${categoryId}`, JSON.stringify({
      answers,
      index: currentIndex
    }));
  }
}, [answers, currentIndex]);

// On complete:
localStorage.removeItem(`assessment_${categoryId}`);
```

#### 3.3 Add "View History" Link to Results Page

**Files to Modify**:
- `src/pages/AssessmentResults.tsx`

**Changes**:
Add a button to view all past results:

```tsx
// After the Retake Assessment button (around line 398):
<Button onClick={() => navigate("/app/my-results")} variant="ghost">
  <History className="h-4 w-4 mr-2" />
  View All Results
</Button>
```

---

### Phase 4: Admin Enhancements (Future)

#### 4.1 Question Bank Management

Create a new admin page for managing assessment questions:
- View all questions by profession category
- Add/edit/delete questions
- Set question weights and display order
- Toggle question active status

This would require a new component: `src/components/dashboard/AssessmentQuestionsManager.tsx`

---

## Database Schema Notes

The schema is well-designed:
- `career_assessments` - Stores results with proper relations to `talents`, `users`, and `profession_categories`
- `assessment_questions` - Questions with flexible JSONB options and category grouping
- `assessment_access_codes` - Retake codes with expiration and usage tracking

**RLS Policies are appropriate**:
- Anyone can submit assessments (INSERT)
- Users can view own assessments by user_id
- Admins can manage all

---

## Implementation Priority

| Phase | Items | Estimated Effort |
|-------|-------|------------------|
| 1 (Critical) | Fix duplicate credits, edge function auth, flow alignment | 2-3 hours |
| 2 (High) | Pagination, PDF improvements, email fix | 2-3 hours |
| 3 (UX) | PhoneInput, progress persistence, history link | 1-2 hours |
| 4 (Future) | Question bank management | 4-6 hours |

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `src/components/assessment/LeadCaptureForm.tsx` | Remove credit deduction, add PhoneInput |
| `src/pages/app/AppCareerAssessment.tsx` | Add cooldown check (optional) |
| `supabase/functions/analyze-career-assessment/index.ts` | Fix ownership check to include talent_id |
| `src/components/dashboard/AssessmentLeadsManager.tsx` | Add pagination |
| `src/components/assessment/ScorecardPDFTemplate.tsx` | Fix fonts, improve rendering |
| `src/pages/app/MyResults.tsx` | Fix email case sensitivity |
| `src/components/assessment/AssessmentStepper.tsx` | Add localStorage progress persistence |
| `src/pages/AssessmentResults.tsx` | Add history link |

