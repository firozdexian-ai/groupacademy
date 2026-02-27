
# Fix Job Posting Approval Error in Admin Panel

## Root Cause

When clicking "Approve & Create Job" in the admin panel, the job insert fails because:
1. The `application_type` column defaults to `'email'`
2. A database trigger (`enforce_job_application_email`) requires `application_email` to be present when `application_type` is `'email'`
3. The insert in `GigSubmissionsManager.tsx` does not set `application_type` or `application_email`, triggering the validation error

## Fix

**File:** `src/components/dashboard/GigSubmissionsManager.tsx`

In the `approveAndCreateJobMutation` (around line 287), update the job insert to set `application_type: 'internal'` instead of relying on the default `'email'`. This bypasses the email validation trigger since gig-submitted jobs are managed internally. Also include `profession_category_id` from the parsed data if available.

```typescript
const { error: jobError } = await supabase.from("jobs").insert({
  title: job?.title || "Untitled Position",
  company_name: job?.company_name || "Unknown Company",
  location: job?.location || null,
  job_type: job?.job_type || "full_time",
  experience_level: job?.experience_level || "entry",
  description: job?.description || sd?.raw_text || "",
  source_image_url: sd?.source_image_url || null,
  source_platform: "other",
  application_type: "internal",    // <-- prevents trigger error
  profession_category_id: job?.profession_category_id || null,
  is_active: true,
});
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/GigSubmissionsManager.tsx` | Add `application_type: "internal"` and `profession_category_id` to job insert |
