

# Consolidated Platform Stabilization & Building Phase Plan

This plan covers everything needed to make the platform fully operational: fixing the conversational auth, completing previously planned work, and addressing infrastructure gaps identified from the CTO reference document and workforce operating model.

---

## Part 1: Conversational Auth (Aisha) — Fix & Stabilize

**Current State**: The `/auth` route renders `AuthChat.tsx` which calls the `ai-auth-agent` edge function. The flow itself is architecturally sound — Aisha generates conversation directives while all sensitive auth operations happen client-side via Supabase.

**Known Issue**: Per the stack overflow context, the preview environment's fetch proxy breaks Supabase auth POST requests. The auth flow likely works on the **published URL** (`groupacademy.lovable.app`) but fails in preview.

**Action Items**:
1. **Test on published URL first** — if auth works there, no code changes needed for the core flow.
2. **Add `apikey` header to edge function call** — the `useAuthChat.ts` `callAgent` function currently omits the `apikey` header, which some environments require. Add `apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` to the fetch headers.
3. **Improve error resilience** — add a visible "Switch to classic login" link on the auth chat page so users always have a fallback if the AI agent is slow or unavailable.
4. **Fix redirect parameter** — `AuthChat.tsx` reads `returnTo` from search params but `AuthGate` sends `redirect`. Standardize to one parameter name across the platform.

**Files**: `src/hooks/useAuthChat.ts`, `src/pages/AuthChat.tsx`

---

## Part 2: Jobs Manager & KPI — Verify Recent Changes

**Current State**: Pagination loops (`fetchAllRows`) and application type filter were added in the last implementation cycle. The KPI dashboard got country distribution and all-time totals.

**Action Items**:
1. **Verify the pagination loop** actually runs correctly — test that country counts reflect real data (4,500+ jobs).
2. **Verify application type filter** cascades properly to both the jobs list and the location counts.
3. **Fix any remaining 1,000-row caps** in edge cases (e.g., daily jobs data query in KPI dashboard).

**Files**: `src/components/dashboard/JobsManager.tsx`, `src/components/dashboard/JobsKPIDashboard.tsx`

---

## Part 3: Country & Profession Data Hygiene — Complete Remaining Work

**Current State**: The `normalize_country_name()` function and trigger exist. The `deduct_credits` RPC was updated to numeric. But profession alignment (matching `custom_profession` to `profession_categories`) has NOT been done.

**Action Items**:
1. **Run a one-time profession alignment** — create an edge function (`align-talent-professions`) that fetches all talents with `profession_category_id IS NULL` and `custom_profession IS NOT NULL`, fetches all `profession_categories`, and uses AI to match each custom profession to the closest category. Updates the FK in bulk.
2. **Add profession collection to onboarding** — the current `OnboardingWizard` has 3 steps (Welcome, Profile/CV, Explore) but does NOT collect profession. Add a profession dropdown (from `profession_categories`) to the CV upload step.
3. **Normalize jobs location data** — run a one-time SQL update to apply `normalize_country_name()` to the country portion of `jobs.location` where applicable (many jobs store city+country like "Dubai, UAE" → needs parsing).

**Files**: New edge function `supabase/functions/align-talent-professions/index.ts`, `src/components/onboarding/CVUploadStep.tsx`, new migration SQL

---

## Part 4: Job Recommendations — Verify Country Priority

**Current State**: The `suggest-jobs-for-talent` edge function was updated with country-priority logic and `COUNTRY_ALIASES` mapping.

**Action Items**:
1. **Verify the edge function is deployed** and the country-first pre-filtering works (local jobs → then international fill).
2. **Test with a Bangladesh-based talent** to confirm majority of results are BD jobs.

**Files**: `supabase/functions/suggest-jobs-for-talent/index.ts`

---

## Part 5: Per-Response Credit Economy — Verify & Fix

**Current State**: Migration to `numeric(12,1)` was run. `useAgentChat.ts` was updated to remove session timers and add per-response deduction. `creditPricing.ts` shows AI_AGENT_CHAT cost = 1 per response.

**Action Items**:
1. **Verify the `deduct_credits` RPC** accepts numeric values (both the integer and numeric overloads exist — ensure the numeric one is called).
2. **Verify `commission_kickback` trigger** still works with numeric amounts (it references `NEW.amount` which is now numeric).
3. **Test agent chat end-to-end** — send a message, confirm 1 credit is deducted, confirm balance updates in real-time.
4. **Set `credit_cost = 0` for AI General agent** in the database if not already done.

**Files**: `src/hooks/useAgentChat.ts`, `src/components/ai-agents/AgentChatDialog.tsx`

---

## Part 6: Workforce Platform — Phase 2 Build

**Current State**: `workforce_members` and `talent_assignments` tables exist. `commission_kickback` trigger is live. `WorkforceManager.tsx` handles basic CRUD. But the planned Phase 2 features are NOT built.

**Action Items**:
1. **Create `workforce_tasks` table** — tasks assigned to executives with status tracking (pending/in_progress/done), due dates, and AI-generated descriptions.
2. **Create `workforce_journey` table** — tracks each member's 6-month sustainability journey (Phase 1: Onboarding months 1-2, Phase 2: Growth months 3-4, Phase 3: Sustainability months 5-6).
3. **Build `ai-workforce-executive` edge function** — AI agent that generates daily task boards and JDs for workforce members based on their role type and assigned talents.
4. **Auto-post jobs for new workforce positions** — when a new `workforce_members` row is created, trigger automatic job posting.
5. **TaskBoard UI component** — dashboard tab showing daily tasks, completion status, and journey progress for each workforce member.

**Files**: New migration SQL, new edge function, new component `src/components/dashboard/WorkforceTaskBoard.tsx`

---

## Part 7: Platform-Wide Bug Fixes & Polish

**Action Items**:
1. **Redirect parameter inconsistency** — some components use `redirect`, others use `returnTo`. Standardize to `returnTo` across all auth redirects (`AuthGate.tsx`, `ProtectedRoute.tsx`, `AuthChat.tsx`, `AuthClassic.tsx`).
2. **`handle_new_user_talent` trigger** — currently defaults country to `'BD'` which bypasses the normalize trigger (since it's already a valid value but should be `'Bangladesh'`). Update the default to `'Bangladesh'`.
3. **Onboarding profession gap** — new signups have no `profession_category_id`. Add profession selection to onboarding flow.
4. **Edge function auth headers** — ensure all client-side edge function calls include the `apikey` header for consistency.

**Files**: Multiple components, migration SQL for trigger update

---

## Implementation Priority

1. **Part 1** — Auth fix (critical, users can't log in)
2. **Part 7** — Quick bug fixes (redirect params, trigger defaults)
3. **Part 2** — Verify Jobs Manager changes work
4. **Part 5** — Verify credit economy changes work
5. **Part 3** — Profession alignment (data quality)
6. **Part 4** — Verify job recommendations
7. **Part 6** — Workforce Phase 2 (largest scope, new feature)

---

## Technical Notes

- Auth issues in preview are environment-specific — always test on the published URL (`groupacademy.lovable.app`) first.
- The `deduct_credits` RPC has two overloads (integer and numeric). The numeric version should be the active one after migration.
- Profession alignment will use the Lovable AI gateway (`google/gemini-2.5-flash`) to batch-match ~2,000 talents' custom professions to the existing ~50 profession categories.
- Workforce Phase 2 builds on the existing `commission_kickback` trigger and `talent_assignments` infrastructure.

