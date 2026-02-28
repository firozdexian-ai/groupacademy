

# Fix: Frontend Not Processing Edge Function Response

## Problem
The backend function works correctly (confirmed: returns 200 with valid data in ~3.7 seconds). The UI stays stuck at 99% because the frontend fails to process the response and transition out of the "loading" phase.

## Root Cause
Two issues in `ExternalApplicationPrep.tsx`:

1. **Stale closure**: `callEdgeFunction` is a plain function, but `startScrape` is wrapped in `useCallback([jobId, applicationUrl])`. When `startScrape` calls `callEdgeFunction`, it may reference a stale version that captures outdated state (e.g., old session).

2. **Silent failure**: If `response.json()` fails for any reason (malformed body, network hiccup), the error is caught but the `phase` stays as `"loading"` because the catch block doesn't explicitly set a fallback phase.

## Fix (1 file)

### `src/components/jobs/ExternalApplicationPrep.tsx`

1. **Wrap `callEdgeFunction` in `useCallback`** so `startScrape` always references the latest version
2. **Add comprehensive console logging** to trace the exact point of failure
3. **Move `clearTimeout` after `response.json()`** so the timeout can still fire if body parsing hangs
4. **Add explicit phase fallback in catch** -- if an error occurs but `error` state doesn't get set, force phase to show the error UI
5. **Add a `finally` block** to guarantee the loading state resolves even on unexpected failures

Key code changes:
- Add `console.log` before/after the fetch call, after response parsing, and in the catch block
- Move `clearTimeout(timeoutId)` to after `const data = await response.json()` 
- In `startScrape`'s catch block, always call `setPhase("scrape_failed")` as a safety net so the UI never stays stuck on "loading"
- Include `callEdgeFunction` in `startScrape`'s dependency array

## Expected Outcome
The UI will either show results (on success) or the error/fallback state (on failure) -- it will never stay stuck at 99%.

