

# Cross-Filter Cascading for Jobs Manager

## What Changes
When the admin selects a **country filter**, the **company dropdown** and **status counts** should dynamically update to show only companies and statuses relevant to jobs in that geography. Similarly, selecting a company should reflect geography-aware counts.

## How It Works

### Current State
- `companiesList` is loaded once from the `companies` table on mount — static, never changes
- `statusFilter`, `locationFilter`, `companyFilter` are independent — no cross-influence
- Country counts are computed once from all active jobs

### Implementation

**1. Derive filtered companies from the current job results**

Instead of showing all companies in the dropdown, compute a `filteredCompaniesList` from the fetched jobs data (which already respects the current location and status filters). This means:
- Select a country → company dropdown only shows companies with jobs in that country
- Select a status → company dropdown only shows companies matching that status

**2. Derive status counts from filtered data**

Add a secondary query (or compute from the main query results) that counts jobs by status within the current location + company filters. Display these counts as badges next to each status option in the dropdown (e.g., "Active (42)", "Inactive (8)", "Featured (3)").

**3. Derive country counts respecting current filters**

Update `countryCounts` to recompute whenever `statusFilter` or `companyFilter` changes, so the location dropdown shows accurate per-country job counts given the other active filters.

### Technical Approach

- Add a `useEffect` that runs a lightweight count query whenever any filter changes, fetching distinct company names, status breakdowns, and location distributions for the *other* active filters
- Use `Promise.all` to run these 2-3 count queries in parallel
- Store results in `filteredCompaniesList`, `statusCounts`, and updated `countryCounts`
- Keep the full `companiesList` for the Job Form (create/edit), but use `filteredCompaniesList` for the filter dropdown

### File Changes

| File | Change |
|------|--------|
| `src/components/dashboard/JobsManager.tsx` | Add cascading filter logic: `filteredCompaniesList` derived from current filters, `statusCounts` badges, reactive `countryCounts`. Update filter dropdowns to show counts and use filtered lists. |

No database changes needed.

