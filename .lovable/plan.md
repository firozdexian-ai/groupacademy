
# Pre-Publication System Audit Report

## Executive Summary
Found **3 bugs**, **4 security warnings**, and **6 improvement areas** that should be addressed before publishing.

---

## Critical Bugs (Must Fix)

### BUG 1: Outdated Intake Date Options
**File:** `src/components/abroad/RoadmapIntakeForm.tsx` (lines 46-52)
**Issue:** The Study Abroad Roadmap intake options include "Fall 2025" but the current date is February 2026, making this a past date.

**Current Code:**
```typescript
const INTAKE_OPTIONS = [
  "Fall 2025",    // PAST - should be removed
  "Spring 2026",  // Current semester
  "Fall 2026",
  "Spring 2027",
  "Fall 2027",
];
```

**Fix:** Update to dynamically generate options or update static list:
```typescript
const INTAKE_OPTIONS = [
  "Fall 2026",
  "Spring 2027", 
  "Fall 2027",
  "Spring 2028",
  "Fall 2028",
];
```

---

### BUG 2: Incomplete TODO in Production Code
**File:** `src/pages/app/AIAgents.tsx` (line 104)
**Issue:** Company agent name is hardcoded as `null` with a TODO comment.

```typescript
companyName: null, // TODO: Join with companies table
```

**Fix:** Either implement the companies table join or remove the `companyName` field if not needed.

---

### BUG 3: Debug Console Log in Production
**File:** `src/pages/app/StudyAbroadDetail.tsx` (line 37)
**Issue:** Debug logging left in production code.

```typescript
console.log("🔍 Fetching program details for ID:", id); // Debug log
```

**Fix:** Remove or conditionally log only in development.

---

## Security Findings (Important)

### SEC 1: Leaked Password Protection Disabled (WARN)
**Finding:** Auth configuration doesn't check passwords against known breach databases.
**Impact:** Users may set compromised passwords.
**Fix:** Enable leaked password protection in Auth settings.

### SEC 2: RLS Policy Always True (WARN) - 9 occurrences
**Finding:** Some RLS policies use `USING (true)` or `WITH CHECK (true)` for INSERT/UPDATE/DELETE.
**Tables Affected:** Multiple analytics and logging tables.
**Impact:** These tables may allow unintended write access.
**Fix:** Review and tighten policies to require authentication or specific conditions.

### SEC 3: Function Search Path Mutable (WARN) - 2 functions
**Finding:** Two database functions don't have `search_path` set.
**Impact:** Potential for search path injection attacks.
**Fix:** Add `SET search_path = 'public'` to affected functions.

### SEC 4: Talent Email Exposure (ERROR)
**Finding:** RLS policies on talents table allow access via email matching in addition to user_id.
**Impact:** Anyone knowing a user's email could potentially access their profile data.
**Fix:** Strengthen policies to require user_id matching only.

---

## UI/UX Improvements

### UI 1: Mobile Tab Labels Too Long
**File:** `src/pages/app/StudyAbroadRoadmapResults.tsx` (lines 309-331)
**Issue:** 5 tabs in roadmap results may overflow on mobile.
**Fix:** Icons are hidden on `sm:` breakpoint which is good, but consider tab scrolling.

### UI 2: Processing State Could Show Progress
**File:** `src/pages/app/StudyAbroadRoadmapResults.tsx`
**Enhancement:** The "Generating Your Roadmap" state could show progress stages instead of just a spinner.

---

## Code Quality Issues

### CQ 1: Placeholder Text Consistency
**Files:** Multiple service setup pages
**Issue:** Phone placeholder formats vary (`01XXXXXXXXX`, `+880XXXXXXXXX`, `01XXX-XXXXXX`).
**Fix:** Standardize placeholder format across forms.

### CQ 2: Potential React Router Warnings
**Console:** Two deprecation warnings about future flags.
**Fix:** Add future flags to BrowserRouter configuration:
```typescript
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

### CQ 3: Duplicate Route Definitions
**File:** `src/App.tsx`
**Issue:** Blog routes are defined both at root level (`/blog`) and under `/app/learning/blog` and `/app/blog`.
**Impact:** Minor - works but adds confusion.

---

## Database Health Check Results

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | Pass | All user tables have RLS |
| Notifications | Pass | Uses `talent_id` correctly |
| Credits System | Pass | UUID validation in place |
| Study Abroad Roadmaps | Pass | New table properly configured |

---

## Recommended Actions (Priority Order)

### High Priority (Block Publication)
1. Fix outdated intake dates in RoadmapIntakeForm
2. Enable leaked password protection
3. Review and tighten permissive RLS policies on write operations

### Medium Priority (Fix Soon After Launch)
4. Complete company agent name join implementation
5. Remove debug console.log statements
6. Standardize phone placeholder formats

### Low Priority (Technical Debt)
7. Add React Router future flags
8. Clean up duplicate blog routes
9. Add search_path to database functions

---

## Files Requiring Changes

| File | Priority | Changes |
|------|----------|---------|
| `src/components/abroad/RoadmapIntakeForm.tsx` | High | Update intake options |
| `src/pages/app/StudyAbroadDetail.tsx` | Medium | Remove debug log |
| `src/pages/app/AIAgents.tsx` | Medium | Implement company join or remove field |
| Database migration | High | Fix function search_path |

---

## Summary

The codebase is generally well-structured with good error handling and timeout patterns. The main concerns are:

1. **Data accuracy** - Past dates showing in forms
2. **Security hardening** - A few RLS policies need tightening
3. **Code cleanup** - Remove TODOs and debug logs before production

Once these items are addressed, the application is ready for publication.
