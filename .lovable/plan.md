## A5.2 — Companies & Locations Views

Both `CompaniesView` and `LocationsView` are currently 3-line "coming soon" stubs even though the full data + card components already exist. The dashboard RPC already returns `companies: CompanyWithSignal[]` and `countries: CountryWithSignal[]`, and `CompanyCard` / `CountryCard` are production-ready (197 + 207 LOC) but unmounted. The `followed_companies` table exists but has no hook.

### Scope

**In:** `CompaniesView.tsx`, `LocationsView.tsx`, follow mutation hook, jargon scrub on the two card files + the two `withSignal` hooks + `useJobsHubDashboard`.

**Out:** Public `/c/:slug` company pages, country detail pages, `/app/jobs/all` filter wiring beyond simple query-param deep-links, A5.3 Tools.

### Step 1 — Build `useFollowedCompanies` hook

`src/domains/companies/hooks/useFollowedCompanies.ts`:
- `useFollowedCompanies()` → `useQuery` reading `followed_companies` for current user, returns `Set<string>` of `company_name`.
- `useToggleFollowCompany()` → `useMutation` that inserts or deletes by `(user_id, company_name)`; invalidates `["followed-companies"]` + `["jobs-hub-dashboard"]`. Optimistic update on the Set.
- Auth-gate: if no user, mutation triggers `navigate("/auth?returnTo=/app/jobs?tab=company")`.

### Step 2 — Replace `CompaniesView` stub

`src/domains/jobs/components/views/CompaniesView.tsx`:
- Props: `{ companies?: CompanyWithSignal[] }`.
- Empty state (no data): friendly message "No companies hiring right now — check back soon." + link to `/app/jobs/all`.
- Sort: already sorted by RPC; render as responsive grid `grid-cols-1 sm:grid-cols-2` with 12-px gap.
- Map each → `<CompanyCard company isFollowing={follows.has(company.company_name)} onToggleFollow={() => toggle(company.company_name)} onClick={() => navigate(\`/app/jobs/all?company=\${encodeURIComponent(company.company_name)}\`)} />`.
- Show top 24; "View all companies" link at bottom → `/app/jobs/all?tab=company` (deferred filter, harmless today).

### Step 3 — Replace `LocationsView` stub

`src/domains/jobs/components/views/LocationsView.tsx`:
- Props: `{ countries?: CountryWithSignal[]; talent?: any }`.
- Detect user country from `talent?.country` (case-insensitive); pin matching `CountryCard` first with `isUserCountry`.
- Grid: `grid-cols-1 sm:grid-cols-2` of `<CountryCard>` for remaining countries.
- `onCityClick={(city) => navigate(\`/app/jobs/all?city=\${encodeURIComponent(city)}\`)}`.
- Empty state mirrors Step 2.
- Optional: small "Remote-friendly" callout strip at top using `dashboard.remote` (active count + top 3 logos) → links to `/app/jobs/all?remote=true`. Skip if `remote.active_jobs === 0`.

### Step 4 — Jargon scrub (behavior unchanged)

Replace internal monologue copy in:
- `CompanyCard.tsx` — JSDoc header, comments, aria-labels ("ecosystem career updates" → "jobs"), drop the `trackError` null-guard noise (keep the early `return null`).
- `CountryCard.tsx` — same treatment; "Local Context" → "Your country"; aria-labels simplified; remove "macro tracking employment profile" tooltip → just company name.
- `useCompaniesWithSignal.ts` + `useCountriesWithSignal.ts` — strip "Digital Workforce / REGISTRY_SYNC_FAULT / Z0 Hardened" from `console.error` and thrown messages; throw the original error.
- `useJobsHubDashboard.ts` — strip the "Phase Z0", "HUD: EXECUTING_", "Digital Workforce" comments and console line.

### Step 5 — Verify

- `/app/jobs?tab=company` → grid renders → tap heart → row optimistically fills → reload → state persists.
- `/app/jobs?tab=country` → user's country pinned with badge → tap city chip → lands on `/app/jobs/all?city=…`.
- Unauth user tapping heart → redirected to `/auth?returnTo=…`.
- Console clean of "Digital Workforce" noise after navigating both tabs.
- Append `## A5.2 — shipped` block to `.lovable/launch-audit.md`.

### Files touched

- new: `src/domains/companies/hooks/useFollowedCompanies.ts`
- rewrite: `src/domains/jobs/components/views/CompaniesView.tsx`, `src/domains/jobs/components/views/LocationsView.tsx`
- edit: `src/domains/jobs/components/CompanyCard.tsx`, `src/domains/jobs/components/CountryCard.tsx`, `src/domains/companies/hooks/useCompaniesWithSignal.ts`, `src/hooks/useCountriesWithSignal.ts`, `src/domains/jobs/hooks/useJobsHubDashboard.ts`, `.lovable/launch-audit.md`

Est. 35–45 min.
