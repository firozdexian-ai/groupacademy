

# Fix: Edge Function Timeout Causing 99% Hang and Lost Credits

## Root Cause (Confirmed with Data)

- **3 credit deductions found** (50 credits each) -- the function runs and deducts credits successfully
- **0 cached questions** -- the function crashes/times out BEFORE completing the work
- The function chains 4+ sequential API calls (Firecrawl scrape -> AI question extraction -> AI answer generation -> AI summary generation), easily exceeding the edge function runtime limit
- Credits are deducted BEFORE any work begins, so users lose credits on every failed attempt

## Fix Strategy

Two changes: make the edge function faster and more resilient, and protect credits.

### 1. Edge Function (`supabase/functions/prepare-external-application/index.ts`)

**A. Add timeout to Firecrawl call (10 seconds max)**
- Wrap the Firecrawl fetch in an AbortController with a 10-second timeout
- If Firecrawl hangs, fail fast to the screenshot fallback path instead of blocking the entire function

**B. Move credit deduction AFTER successful processing**
- Only deduct credits when we have results to return
- This prevents users from losing credits on timeouts/failures
- If the function fails, credits remain untouched

**C. Add AbortController timeouts to all AI gateway calls (25 seconds each)**
- Prevent any single AI call from hanging indefinitely
- If one AI call fails, return partial results rather than nothing

**D. Reduce AI calls from 4 to 3 max**
- When scrape fails: only generate summary (1 AI call), no credit deduction (free fallback)
- When scrape succeeds: extract questions (1 AI call) + answers + summary in parallel (2 AI calls) = 3 total

### 2. Frontend (`src/components/jobs/ExternalApplicationPrep.tsx`)

**A. Reduce fetch timeout from 90s to 60s**
- Align with edge function runtime limits

**B. Add a "credits will be deducted only on success" note**
- Reassure users they won't lose credits if it fails

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/prepare-external-application/index.ts` | Move credit deduction after processing; add timeouts to Firecrawl and AI calls; fail fast on scrape failure without charging |
| `src/components/jobs/ExternalApplicationPrep.tsx` | Reduce timeout to 60s; minor UI messaging update |

## Question Caching (Already Built)

The caching system in `external_application_questions` table is already coded correctly. Once the function stops timing out, it will:
- Cache questions by `application_url` on first successful scrape
- Serve cached questions on subsequent requests for the same URL (skipping Firecrawl entirely)
- This makes repeat applications to the same URL instant

## Expected Outcome

- Function completes within the runtime limit by using timeouts on all external calls
- Users only pay credits when they receive results
- Cached questions make subsequent applications to the same URL much faster
- Frontend reliably shows results or a clear error (never stuck at 99%)

