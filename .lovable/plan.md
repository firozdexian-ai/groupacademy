

# Industries Manager — Add to Companies & Contacts Section

## Current Data

You have **1,550 companies** with **106 unique industries** and solid coverage — only 163 companies (10.5%) have no industry assigned. Top industries include Software Development (239), IT Services (134), Staffing & Recruiting (120), Financial Services (56), and Advertising (54).

The industry field is free-text on the `companies` table, which means there are likely duplicates and inconsistencies (e.g., "Banking" vs "Financial Services"). A dedicated Industries manager would let you:

1. **See industry distribution** at a glance (how many companies per industry)
2. **Normalize** messy entries (merge duplicates, fix typos)
3. **Filter companies by industry** in the Companies tab
4. **Cross-platform analytics** — industry-wise job counts, application rates, talent distribution

## Recommendation: Yes, include it

### What to build

**New "Industries" tab** in Companies & Contacts (after Company Agents):

- **Industry list view** — table/cards showing each unique industry, company count, and job count (joined from `jobs` via `company_name`)
- **Merge/Rename tool** — select multiple industries → merge into one canonical name (bulk UPDATE on `companies.industry`)
- **Industry filter in Companies tab** — add a dropdown to filter companies by industry (similar to job filter we just added)
- **KPI row** — Total industries, companies with no industry, top industry

### No new database table needed

We keep `industry` as free-text on `companies`. The Industries tab is a **management view** that aggregates and normalizes existing data. No schema change required.

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/AdminSidebar.tsx` | Add "Industries" nav item to Companies & Contacts group |
| `src/components/dashboard/IndustriesManager.tsx` | **New file** — industry list, merge/rename, KPI cards |
| `src/components/dashboard/CompaniesManager.tsx` | Add industry filter dropdown |
| `src/pages/Dashboard.tsx` | Register Industries tab, lazy import |

No database migrations.

