

## Fix: Job Save Failing Due to Missing `preferred_skills` Column

### Problem Identified

The error shows: **"Could not find the 'preferred_skills' column of 'jobs' in the schema cache"**

**Root Cause Chain:**

1. The `parse-job-post` edge function extracts `preferred_skills` from job posts (line 181-185 in the edge function)
2. `handleParseJobPost` merges ALL parsed data into `formData` via `{ ...prev, ...data.parsed }`
3. `handleSaveJob` sends ALL `formData` to Supabase via `{ ...formData, company_id: companyId }`
4. The `jobs` table doesn't have a `preferred_skills` column → **Error**

---

### Solution (Two Parts)

#### Part 1: Add Missing Column to Database

Add the `preferred_skills` column to store this useful data:

```sql
ALTER TABLE public.jobs 
ADD COLUMN preferred_skills jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.jobs.preferred_skills IS 'Array of preferred/bonus skills for the job';
```

#### Part 2: Sanitize Payload Before Save (Safety Net)

Even after adding the column, we should filter out any fields that don't exist in the schema to prevent future similar issues:

**File: `src/components/dashboard/JobsManager.tsx`**

```typescript
// Add a list of valid job fields
const VALID_JOB_FIELDS = [
  'title', 'company_name', 'company_logo_url', 'location', 'job_type', 
  'experience_level', 'salary_range_min', 'salary_range_max', 'description',
  'ai_enhanced_description', 'requirements', 'preferred_skills', 'application_type',
  'application_email', 'application_url', 'source_url', 'source_platform',
  'profession_category_id', 'deadline', 'is_active', 'is_featured', 
  'posted_by', 'source_image_url', 'company_id', 'ai_assessment_enabled',
  'assessment_config', 'vacancies'
];

// In handleSaveJob, filter the payload:
const payload = Object.fromEntries(
  Object.entries({ ...formData, company_id: companyId })
    .filter(([key]) => VALID_JOB_FIELDS.includes(key))
);
delete payload.id;
```

---

### Files to Modify

| File | Change |
|------|--------|
| Database Migration | Add `preferred_skills` column to `jobs` table |
| `src/components/dashboard/JobsManager.tsx` | Filter payload to only include valid columns |

---

### Why This Happened

The AI parsing function was designed to extract as much useful data as possible (including preferred skills), but the database schema wasn't updated to accommodate this field. The form was blindly passing all parsed data to the database without validation.

---

### Additional Fields to Consider

While we're at it, the edge function also extracts these fields that don't exist in the schema:
- `company_about` → Could add to `companies` table
- `company_website` → Could add to `companies` table
- `salary_note` → Could add to `jobs` table

For now, we'll focus on `preferred_skills` to fix the immediate issue.

