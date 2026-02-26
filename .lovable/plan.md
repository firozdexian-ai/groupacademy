

# Maximize LinkedIn Data Utilization -- Companies + Jobs

## Problem

The current LinkedIn import only creates job records with flat `company_name` and `company_logo_url` text fields. It ignores the rich company data in the JSON (website, industry, LinkedIn URL, description, employee count, HQ address) and never links jobs to the centralized `companies` table via `company_id`. This means:

- Companies Manager stays empty for LinkedIn-sourced employers
- Job detail pages can't show enriched company profiles
- Duplicate company names pile up without consolidation

## Solution

Enhance `BatchLinkedInJobUpload.tsx` to **auto-resolve companies** before inserting jobs -- exactly like `JobsManager.handleSaveJob` already does for single jobs (lines 1014-1031), but in bulk with enriched data.

## What Data We Extract

From each job's `company` object in the LinkedIn JSON:

```
LinkedIn Field              -->  companies Column     Notes
--------------------------       ------------------   -------------------------
company.name                     name                 Match key (case-insensitive)
company.website                  website              e.g. "http://bdjobs.com"
company.linkedinUrl              linkedin_url         e.g. "linkedin.com/company/x"
company.logo (400x400)           logo_url             Highest-res available
company.industries[0].name       industry             e.g. "IT Services"
company.locations[0] (HQ)        address              Formatted HQ address
company.description              notes                Company bio (first 500 chars)
```

This means every imported company gets a proper profile -- not just a name.

## Implementation Steps

### Step 1: Company Resolution Phase (before job insert)

During the import, after parsing and before inserting jobs:

1. **Extract unique companies** from the parsed JSON (deduplicate by name)
2. **Query existing companies** from the database using case-insensitive name matching
3. **Create missing companies** with all enriched fields (website, industry, LinkedIn URL, logo, address, notes)
4. **Update sparse existing records** -- if a company already exists but is missing fields like `website` or `linkedin_url`, fill them in from the LinkedIn data
5. **Build a name-to-ID map** and assign `company_id` to each job before batch insert

### Step 2: Enhanced Data Mapping

Beyond companies, we also maximize other data fields already in the JSON but currently ignored:

| LinkedIn Field | Target | Currently Used? | Change |
|---|---|---|---|
| `company.*` (full object) | `companies` table + `company_id` | No | **New -- create/link companies** |
| `descriptionHtml` | `ai_enhanced_description` | Yes | Already mapped |
| `workRemoteAllowed` | `job_type` override to `remote` | Yes | Already mapped |
| `industries[]` | Job's industry context | No | **New -- store in company record** |
| `company.description` | Company bio | No | **New -- store as `notes`** |
| `company.website` | Company website | No | **New -- store in company record** |
| `company.linkedinUrl` | Company LinkedIn profile | No | **New -- store in company record** |
| `company.locations[0]` (HQ) | Company address | No | **New -- store in company record** |

### Step 3: Preview Enhancements

Update the preview table to show a "Companies" summary:
- Total unique companies found
- How many are new vs. already exist
- A small badge per job row showing if the company is "New" or "Existing"

### Step 4: Import Flow Update

The import sequence becomes:

```
1. Parse JSON
2. Deduplicate jobs (by source_url)
3. Extract unique companies
4. Query existing companies (by name)
5. Upsert companies (create new / enrich existing)
6. Build company name -> ID map
7. Assign company_id to each job
8. Batch insert jobs (chunks of 10)
9. Show results: X jobs + Y companies created
```

## Technical Details

### Company Resolution Logic

```typescript
async function resolveCompanies(jobs: LinkedInJob[]) {
  // 1. Extract unique companies by name
  const uniqueCompanies = new Map();
  for (const job of jobs) {
    const name = job.company?.name;
    if (name && !uniqueCompanies.has(name.toLowerCase())) {
      uniqueCompanies.set(name.toLowerCase(), {
        name,
        website: job.company.website || null,
        linkedin_url: job.company.linkedinUrl || null,
        logo_url: job.company.logo || null,
        industry: job.company.industries?.[0]?.name || null,
        address: formatAddress(job.company.locations?.[0]),
        notes: job.company.description?.slice(0, 500) || null,
      });
    }
  }

  // 2. Check which exist already
  const names = [...uniqueCompanies.keys()];
  const { data: existing } = await supabase
    .from("companies")
    .select("id, name, website, linkedin_url, logo_url, industry")
    .in("name", [...uniqueCompanies.values()].map(c => c.name));

  const nameToId = new Map();
  const toCreate = [];
  const toUpdate = [];

  for (const [key, company] of uniqueCompanies) {
    const match = existing?.find(
      e => e.name.toLowerCase() === key
    );
    if (match) {
      nameToId.set(key, match.id);
      // Enrich if fields are missing
      const updates = {};
      if (!match.website && company.website) updates.website = company.website;
      if (!match.linkedin_url && company.linkedin_url) updates.linkedin_url = company.linkedin_url;
      if (!match.logo_url && company.logo_url) updates.logo_url = company.logo_url;
      if (!match.industry && company.industry) updates.industry = company.industry;
      if (Object.keys(updates).length > 0) toUpdate.push({ id: match.id, ...updates });
    } else {
      toCreate.push(company);
    }
  }

  // 3. Create new companies
  if (toCreate.length > 0) {
    const { data: created } = await supabase
      .from("companies").insert(toCreate).select("id, name");
    created?.forEach(c => nameToId.set(c.name.toLowerCase(), c.id));
  }

  // 4. Enrich existing companies
  for (const upd of toUpdate) {
    await supabase.from("companies").update(upd).eq("id", upd.id);
  }

  return nameToId; // Map<lowercase_name, uuid>
}
```

### Updated Job Insert

```typescript
// Before batch insert, assign company_id
const jobsWithCompanyId = newJobs.map(job => ({
  ...job,
  company_id: nameToId.get(job.company_name.toLowerCase()) || null,
}));
```

### Results Summary Update

The results step will now show:
- Jobs created / skipped / errors
- Companies created / enriched
- Apply method breakdown (direct / email / LinkedIn)

### Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/BatchLinkedInJobUpload.tsx` | Add company resolution phase, update LinkedInJob type to include full company data, update preview to show company stats, update import flow, update results summary |

Single file change -- everything stays in the existing import component.

### No Database Changes Needed

- `companies` table already has all needed columns (name, website, linkedin_url, logo_url, industry, address, notes)
- `jobs.company_id` FK already exists
- RLS policies already allow admin inserts on both tables

