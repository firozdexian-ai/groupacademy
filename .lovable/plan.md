
# Fix "Apply with AI" Stuck at 99%

## Root Cause

Two issues are causing the stuck state:

1. **ProcessingCard timer is too short**: The animation duration is set to 30 seconds, but the edge function performs 3-4 sequential API calls (Firecrawl scrape + AI question extraction + profile/job fetch + AI answer generation + AI summary generation). This can easily take 45-60+ seconds. The ProcessingCard reaches 99% at ~30s and stays there.

2. **No timeout handling**: If the edge function takes too long or fails silently, the frontend has no timeout -- it waits indefinitely with the progress stuck at 99%.

3. **Error state not shown when caught**: When the `startScrape` catch block sets `setError(...)`, the component still shows the loading ProcessingCard because the `phase` remains `"loading"` and the error check (`{error && ...}`) is rendered below the loading check (`{phase === "loading" && !error && ...}`). Actually this part is correct since `!error` guards the loading state. BUT the `setPhase` is never changed to something else on error, so the component shows the error block correctly. The real issue is just the duration.

## Fix

### 1. Increase ProcessingCard duration to 60 seconds
Change the `duration` prop from `30000` to `60000` for the scrape path. This better reflects the actual operation time (Firecrawl ~5s + AI extraction ~10s + AI answers ~15-20s + AI summary ~10-15s).

### 2. Add a frontend timeout (90 seconds)
Add an AbortController or setTimeout that sets an error state if the function doesn't respond within 90 seconds, preventing infinite waiting.

### 3. Update the processing stages timing
Redistribute stage messages to match the longer timeline so users see steady progress throughout.

## Changes

| File | Change |
|------|--------|
| `src/components/jobs/ExternalApplicationPrep.tsx` | Increase duration to 60s, add 90s timeout, update stage percentages |

## Technical Details

In `ExternalApplicationPrep.tsx`:

- Change `duration={30000}` to `duration={60000}` for scrape mode and `duration={45000}` for screenshot mode
- Add a `setTimeout` of 90 seconds inside `startScrape` that calls `setError("Request timed out...")` if no response received
- Add more granular stage messages to fill the longer timeline:
  - 0%: "Connecting to application page..."
  - 15%: "Scraping application page..."
  - 30%: "Detecting form questions..."
  - 45%: "Analyzing your profile..."
  - 60%: "Generating personalized answers..."
  - 80%: "Writing tailored responses..."
  - 92%: "Preparing your prep sheet..."
