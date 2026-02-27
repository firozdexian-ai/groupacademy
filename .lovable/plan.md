

# Fix: Allow Multiple Gig Submissions When Pending Exists

## Problem
When a seeker submits a job sharing gig, the "Start" button is replaced with a "Pending review" badge, preventing them from submitting more -- even though the gig allows up to 50 submissions. This blocks the entire job sharing workflow after the first submission.

## Root Cause
In `GigCard.tsx` (line 66), the rendering logic is:

```text
if isMaxed       -> show "Completed" badge
else if hasPending -> show "Pending review" badge  <-- THIS BLOCKS EVERYTHING
else             -> show "Start" button
```

The `hasPending` check hides the Start button whenever **any** submission is pending. This makes sense for one-time gigs (like CV upload) but is wrong for repeatable gigs like job sharing (max 50).

## Solution
Change the logic so that `hasPending` only blocks the button when the gig is a single-completion gig (i.e., `max_completions_per_user` is 1 or null). For multi-submission gigs, show both the pending count info **and** the Start button.

## Changes

### File: `src/components/gigs/GigCard.tsx`

Update the button rendering logic (lines 62-78):

**Before:**
```
isMaxed -> "Completed"
hasPending -> "Pending review" (no button)
else -> "Start" button
```

**After:**
```
isMaxed -> "Completed"
hasPending AND max_completions_per_user is 1 or null -> "Pending review" (no button)
else -> Show "Start" button (with pending count badge alongside if applicable)
```

Specifically:
- If `gig.max_completions_per_user > 1` (repeatable gig), always show the Start button unless maxed out
- Show a small "X pending" indicator next to the button so the user knows prior submissions are being reviewed
- Keep the current blocking behavior for single-use gigs where it makes sense to wait for approval

| File | Change |
|------|--------|
| `src/components/gigs/GigCard.tsx` | Update conditional rendering to allow new submissions on repeatable gigs even when prior submissions are pending |
