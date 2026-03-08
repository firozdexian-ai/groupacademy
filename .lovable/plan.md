

# Clean Up BDT/Taka → USD Global Currency Alignment

## Scope

30 files across `src/` and `supabase/functions/` contain references to BDT, ৳, taka, bKash, Nagad, or Bangladesh-specific payment text. This cleanup aligns everything to **USD ($)** and **Credits** as the global standard per the existing strategy (1 Credit = $0.02 USD).

## Core Changes

### 1. `src/lib/creditPricing.ts` — Central config
- Rename `CREDIT_TO_TAKA` → `CREDIT_TO_USD` (value: `0.02`)
- Update bundles to USD pricing: 100/$2, 500/$9, 1000/$16, 2500/$37.50
- Rename `creditsToTaka` → `creditsToUSD`, `takaToCredits` → `usdToCredits`
- Rename `getCourseCredits(priceTaka)` → `getCourseCredits(priceUSD)`
- Update all JSDoc comments

### 2. `src/components/credits/CreditPurchaseSheet.tsx`
- Replace ৳ with $ in bundle display
- Remove "bKash/Nagad" and "bank transfer" references → "Secure online payment"
- Update savings display to $

### 3. `src/lib/constants/support.ts`
- `getCreditPurchaseMessage`: Change "BDT" → "USD" in WhatsApp message

### 4. `src/components/onboarding/WelcomeBonus.tsx`
- "Worth ৳500" → "Worth $5"

### 5. Salary display files (৳ → $)
- `src/pages/SalaryAnalysisResults.tsx`
- `src/components/salary-analysis/SalaryAnalysisPDFTemplate.tsx`
- `src/pages/app/AppJobDetail.tsx` — `formatSalary` BDT → $
- `src/pages/PublicJobDetail.tsx` — same
- `src/pages/app/AppJobs.tsx` — salary filter badges
- `src/components/jobs/JobPreferencesSheet.tsx` — "BDT/month" → "USD/month"
- `src/components/jobs/JobCard.tsx` (if BDT present)

### 6. Service pricing text (BDT → Credits)
- `src/pages/SalaryAnalysis.tsx` — "Retakes BDT 100" → "Retakes 50 Credits"
- `src/pages/SalaryAnalysisSetup.tsx` — "BDT 100" → "50 Credits"
- `src/components/dashboard/StandaloneMockInterviewCodeGenerator.tsx` — same
- `src/components/dashboard/StandaloneSalaryCodeGenerator.tsx` — same
- `src/components/dashboard/StandaloneAssessmentCodeGenerator.tsx` (if applicable)

### 7. Content/Course pricing
- `src/pages/ContentNew.tsx` — "Price (BDT)" → "Price (USD)"
- `src/pages/ContentEdit.tsx` — "BDT" → "USD", remove ৳2 reference
- `src/components/dashboard/ContentList.tsx` — "BDT {price}" → "${price}"
- `src/components/AccessCodeManager.tsx` — "BDT {price}" → "${price}"
- `src/components/gigs/CourseResellGigForm.tsx` — ৳ → $

### 8. Portfolio pricing
- `src/pages/PortfolioRequest.tsx` — "BDT 2,000" → "$40" (or 500 Credits), "BDT 100" → "$2"

### 9. Dashboard/Admin
- `src/components/dashboard/DashboardOverview.tsx` — "BDT" → "$"
- `src/components/dashboard/CreditsManager.tsx` — revenue display ৳ → $
- `src/pages/InstructorNew.tsx` / `src/pages/InstructorEdit.tsx` — "Hourly Rate (BDT)" → "Hourly Rate (USD)"

### 10. Edge functions
- `supabase/functions/generate-outreach-message/index.ts` — "BDT 1,000" → "$20"

### 11. IR/Investor files (check for BDT)
- `src/components/dashboard/ir/MRRTargetManager.tsx` and related — likely already USD but verify

## Approach
- All 30 files edited in a single pass
- No database migration needed (prices stored as numbers, currency label is display-only)
- `creditsToTaka`/`takaToCredits` renamed with deprecation-safe approach (update all call sites in same commit)

## Files affected: ~30 files
No new files created. No database changes required.

