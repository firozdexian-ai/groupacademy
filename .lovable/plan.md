

# Fix: "Apply with AI" Stuck at 99% — Replace supabase.functions.invoke with Direct Fetch

## Root Cause (Confirmed)

The edge function `prepare-external-application` **works correctly** — verified by 2 direct calls that returned 200 with valid data and properly deducted credits.

The issue is in the frontend: `supabase.functions.invoke()` is silently failing to deliver the response back to the component. This is a known issue with the Supabase JS client in certain environments where the response parsing or error handling doesn't behave as expected, causing the `await` to hang or the returned `data` to be null/unparseable.

Meanwhile, the `ProcessingCard` animation runs to 99% and stays there because no state transition ever happens.

## Fix: Replace `supabase.functions.invoke` with Direct `fetch`

This gives us full control over request/response handling, explicit error codes, and proper timeout via `AbortController`.

### Changes to `src/components/jobs/ExternalApplicationPrep.tsx`

**1. Replace `startScrape` function** with direct `fetch` using:
- `AbortController` for clean 90-second timeout (instead of `setTimeout` race condition)
- Direct URL construction using `VITE_SUPABASE_URL`
- Explicit `Authorization` header from `supabase.auth.getSession()`
- Proper JSON response parsing with error handling for non-2xx status codes

**2. Replace `submitScreenshots` function** with the same direct `fetch` pattern.

**3. Key improvements:**
- `AbortController.abort()` cleanly cancels the network request on timeout (no race condition)
- Explicit status code checking (402 for credits, 401 for auth, 500 for server errors)
- Response body is always consumed and parsed, preventing silent failures
- Cleanup of abort controller in both success and error paths

### Technical Detail

```typescript
// Before (unreliable):
const { data, error: fnError } = await supabase.functions.invoke("prepare-external-application", { body: {...} });

// After (reliable):
const { data: { session } } = await supabase.auth.getSession();
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 90000);

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prepare-external-application`,
  {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({...}),
  }
);
clearTimeout(timeoutId);

if (!response.ok) {
  const errBody = await response.json().catch(() => ({}));
  throw new Error(errBody.error || `Request failed (${response.status})`);
}
const data = await response.json();
```

## Files to Change

| File | Change |
|------|--------|
| `src/components/jobs/ExternalApplicationPrep.tsx` | Replace `supabase.functions.invoke` with direct `fetch` + `AbortController` in both `startScrape` and `submitScreenshots` |

## Expected Outcome

The function will be called directly via `fetch`, bypassing any silent failures in `supabase.functions.invoke`. The response will be properly parsed, timeout will cleanly abort the request, and the UI will transition from loading to results (or error) correctly.

