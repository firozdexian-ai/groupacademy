

# Fix Batch Description Generator — Two Math Bugs

## Root Cause Analysis

**Bug 1 — "remaining" stays at 245:**
The edge function (line 85) computes `totalRemaining = pendingModules.length` BEFORE processing. With `regenerate_all=true`, ALL modules match the filter every time (line 80: `regenerate_all || ...`). So each call fetches the same 248 modules, processes 3, returns `remaining: 248 - 3 = 245`. Next call: same 248 modules (including the 3 already updated), same `remaining: 245`.

**Bug 2 — Total keeps increasing (248→251→254):**
Frontend line 183: `setTotalPending(totalProcessed + remaining)`. Since remaining=245 every call, total = `3+245=248, 6+245=251, 9+245=254...` — it grows by 3 every batch.

## Fix

### Edge Function (`batch-generate-descriptions/index.ts`)

**Normal mode** (`regenerate_all=false`): After processing, re-query DB for fresh count of modules with `<500` chars. Modules we just updated are now `>500`, so they drop out. Remaining naturally decreases.

**Regenerate mode** (`regenerate_all=true`): Accept an `offset` param from the client. Fetch all modules sorted by `created_at`, skip first `offset`, take `batch_size`. Return `remaining = totalModules - offset - processed`.

### Frontend (`BatchDescriptionGenerator.tsx`)

- Pass `offset: totalProcessed` in the request body
- Set `totalPending` once at start, never update it
- Use `remaining` from server for the loop condition only
- Progress = `totalProcessed / totalPending`

### Files to Edit
- `supabase/functions/batch-generate-descriptions/index.ts` — offset support + fresh remaining count
- `src/components/dashboard/BatchDescriptionGenerator.tsx` — fix progress math

