
# Bulk Import LinkedIn Jobs -- Smart Application Routing

## Overview

Build an admin tool that imports LinkedIn scraper JSON and intelligently routes each job's application method based on available data -- prioritizing direct company links and extracted emails over generic LinkedIn URLs.

## Smart Application Logic

The LinkedIn data contains two `applyMethod.type` values:

```text
Type                    Data Available              Our Mapping
--------------------    -------------------------   --------------------------
OffsiteApply            companyApplyUrl (direct)     application_type = 'link'
                                                     application_url = companyApplyUrl
ComplexOnsiteApply      easyApplyUrl (LinkedIn)      application_type = 'link'
                                                     application_url = linkedinUrl
```

Additionally, some job descriptions contain email addresses (e.g., "send CV to careers@eguardian.com"). The importer will:

1. **Check `applyMethod.type`**: If `OffsiteApply`, use `companyApplyUrl` (direct company link)
2. **Extract email from description**: Regex scan for email patterns. If found, set `application_type = 'email'` and `application_email` = extracted email
3. **Fallback**: Use `linkedinUrl` as `application_url` with `application_type = 'link'`

**Priority order**: Company email > Company apply URL > LinkedIn URL

## Data Mapping

```text
LinkedIn Field                    Jobs Column           Notes
-------------------------------   -------------------   -------------------------
title                             title                 Direct
company.name                      company_name          Direct
company.logo (200x200)            company_logo_url      CDN URL
location.parsed.text              location              Parsed location
employmentType                    job_type              Maps to enum
experienceLevel                   experience_level      Text-to-enum mapping
descriptionText                   description           Plain text
descriptionHtml                   ai_enhanced_description  Rich HTML version
applyMethod.companyApplyUrl       application_url       If OffsiteApply
extracted email from description  application_email     If email found
linkedinUrl                       source_url            For dedup + fallback
company.website                   (stored for ref)      Company website
expireAt                          deadline              Direct
salary.min / salary.max           salary_range_min/max  Often null
workRemoteAllowed                 job_type override     If true, set 'remote'
--                                source_platform       'linkedin'
--                                is_active             true
```

### Experience Level Mapping

```text
LinkedIn Value           Our Enum
"Entry level"            entry
"Associate"              entry
"Mid-Senior level"       senior
"Director"               executive
"Executive"              executive
"Internship"             entry
null / unknown           mid (default)
```

## Changes

### 1. New Component: `src/components/dashboard/BatchLinkedInJobUpload.tsx`

A multi-step dialog:

**Step 1 -- Upload**: Accept `.json` file, parse and validate the array structure.

**Step 2 -- Preview with Application Routing**: Table showing:
- Title, Company, Location, Type
- **Apply Method** column showing: "Direct Link" (green), "Email" (blue), or "LinkedIn" (gray) so admin can see how each job will route
- Total count and breakdown by apply method

**Step 3 -- Deduplication**: Check existing `source_url` values where `source_platform = 'linkedin'` to skip duplicates.

**Step 4 -- Import**: Batch insert in chunks of 10, with progress bar.

**Step 5 -- Results**: Summary showing created / skipped / errors, plus breakdown of how many are direct-link vs email vs LinkedIn-only.

### 2. Application Routing Logic

```typescript
function resolveApplicationMethod(job: LinkedInJob) {
  // 1. Check for email in description
  const emailMatch = job.descriptionText?.match(
    /[\w.-]+@[\w.-]+\.\w{2,}/
  );
  
  // 2. Check for direct company apply URL
  const hasDirectUrl = job.applyMethod?.type === 'OffsiteApply' 
    && job.applyMethod?.companyApplyUrl;
  
  if (emailMatch) {
    return {
      application_type: 'email',
      application_email: emailMatch[0],
      application_url: hasDirectUrl 
        ? job.applyMethod.companyApplyUrl 
        : job.linkedinUrl,
    };
  }
  
  if (hasDirectUrl) {
    return {
      application_type: 'link',
      application_url: job.applyMethod.companyApplyUrl,
      application_email: null,
    };
  }
  
  // Fallback: LinkedIn URL
  return {
    application_type: 'link',
    application_url: job.linkedinUrl,
    application_email: null,
  };
}
```

### 3. Wire into JobsManager.tsx

Add an "Import LinkedIn Jobs" button next to the existing "Add Job" button. Clicking it opens the `BatchLinkedInJobUpload` dialog.

### 4. Bonus: Store HTML Description

Use `descriptionHtml` as `ai_enhanced_description` so job detail pages render rich formatted content (lists, bold headings) instead of plain text.

## Technical Details

### No Database Changes Needed

- `source_platform` already supports 'linkedin'
- `application_type` supports 'link' and 'email'
- `application_email`, `application_url`, `source_url` columns exist
- `ai_enhanced_description` column exists for HTML content

### Batch Insert (chunks of 10)

```typescript
for (let i = 0; i < newJobs.length; i += 10) {
  const chunk = newJobs.slice(i, i + 10);
  await supabase.from('jobs').insert(chunk);
  setProgress(((i + 10) / newJobs.length) * 100);
}
```

### Remote Job Handling

If `workRemoteAllowed === true`, override `job_type` to `'remote'` regardless of the `employmentType` field, since remote is more useful info for seekers.

### Files

| File | Change |
|------|--------|
| `src/components/dashboard/BatchLinkedInJobUpload.tsx` | **New** -- LinkedIn JSON import dialog with smart routing |
| `src/components/dashboard/JobsManager.tsx` | Add "Import LinkedIn" button to header |

### Preview Table Columns

```text
Title | Company | Location | Type | Apply Via | Deadline
------|---------|----------|------|-----------|--------
Cloud Manager | Canonical | APJ | Remote | Direct Link | Mar 28
Electrical Mgr | Group Co | Dhaka | Full-time | LinkedIn | Mar 28
Finance Exec | EGUARDIAN | Dhaka | Full-time | Email | Mar 28
```

The "Apply Via" column uses color-coded badges so admin can quickly see the routing quality before importing.
