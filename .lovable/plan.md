

# Fix: "Apply with AI" Failing with 401 Unauthorized

## Root Cause

The edge function analytics show every request to `prepare-external-application` returns **HTTP 401** with ~1.3s execution time. The function boots but never processes the request.

The cause: the function is not listed in `supabase/config.toml`. Without an explicit `verify_jwt = false` entry, the gateway uses its default JWT verification (signing-keys system), which rejects the token before the function code runs. Every other edge function in the project has `verify_jwt = false` and handles auth internally -- this one was missed during creation.

## Why It Gets Stuck at 99%

1. `supabase.functions.invoke()` receives the 401 response
2. But the Supabase JS client wraps non-2xx responses differently -- `fnError` may not be set for 401s in all cases, and `data` may contain the error body
3. The catch block fires but the error message may not propagate clearly to the UI
4. Meanwhile the ProcessingCard animation reaches 99% and stays there

## Fix (1 change)

### `supabase/config.toml` -- Add the missing function entry

Add this block alongside the other function entries:

```toml
[functions.prepare-external-application]
verify_jwt = false
```

This lets the request pass through the gateway to the function code, where auth is handled properly via `getUser(token)`.

### Secondary Fix: Improve error handling in `ExternalApplicationPrep.tsx`

The timeout mechanism has a race condition -- `setTimeout` sets the error state, but the still-running `invoke()` call can overwrite it when it resolves. Add an `AbortController` or a guard flag to prevent this.

Also, the `supabase.functions.invoke` error for 401 may come as `fnError` with a `FunctionsHttpError` type. We should ensure the catch path handles this clearly.

## Files to Change

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `[functions.prepare-external-application] verify_jwt = false` |
| `src/components/jobs/ExternalApplicationPrep.tsx` | Fix timeout race condition with abort guard |

## Expected Outcome

After this fix, the function will receive the request, process Firecrawl scraping and AI generation, and return results to the frontend. The 99% stuck state will be resolved.

