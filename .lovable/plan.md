

# Fix: "Apply with AI" Never Starts — startScrape Not Called

## Root Cause (Confirmed via Browser Testing)

I tested the feature live in the browser and confirmed:
- The dialog opens and shows the ProcessingCard animation counting to 99%
- **Zero network requests** to `prepare-external-application` are made
- **Zero `[ApplyAI]` console logs** appear

The issue is that `startScrape()` is called inside `handleOpenChange`, but Radix Dialog's `onOpenChange` callback only fires on **user-initiated close events** (clicking the X, pressing Escape, clicking the backdrop). When the parent component sets `open={true}`, `handleOpenChange` is **never triggered**, so the scrape never starts. The animation runs to 99% with no actual work happening behind it.

The edge function itself works perfectly (confirmed by direct API test -- returns 200 with valid data in seconds).

## Fix

### File: `src/components/jobs/ExternalApplicationPrep.tsx`

**1. Add a `useEffect` to trigger scrape when dialog opens:**
```typescript
useEffect(() => {
  if (open) {
    setAnswers([]);
    setGeneralSummary("");
    setScreenshots([]);
    setError(null);
    setPhase("loading");
    startScrape();
  }
}, [open]);
```

**2. Simplify `handleOpenChange`** to just pass through to `onOpenChange` (no longer needs to trigger scrape logic):
```typescript
const handleOpenChange = (newOpen: boolean) => {
  onOpenChange(newOpen);
};
```

That is the entire fix. One `useEffect` addition, one simplification.

## Why Previous Fixes Didn't Work

All previous changes (switching from `supabase.functions.invoke` to `fetch`, adding `useCallback`, adding timeouts, restructuring the edge function) were solving the wrong problem. The network call was never being made in the first place. The ProcessingCard was purely animating with no work behind it.

## Expected Outcome

When the dialog opens, the `useEffect` fires, `startScrape` runs, the edge function is called, and results appear (or the fallback UI shows) within seconds.
