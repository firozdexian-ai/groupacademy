# Phase 3.2 — Companies & Locations Tabs Overhaul

3.1 shipped the Browse tab. The next two tabs (Companies, Locations) are still flat aggregations of `jobs.company_name` / `jobs.country` with no real signal. Goal: make each tab a useful discovery surface that pulls a talent toward live, relevant roles — not just a directory.

We'll do **both tabs in this sub-phase** because they share the same architectural lift (aggregation RPCs, follow/save, detail drill-down). Tools tab + Job Details/Application become 3.3 and 3.4.

---

## Goals

1. **Companies tab** → from logo grid into a follow-able employer directory with hiring signal.
2. **Locations tab** → from country accordion into a personalized geo discovery surface (your country first, abroad opportunities, salary/visa hints).
3. Reuse the trending/personalization patterns from 3.1 (RPCs + hooks, no client-side aggregation of 1000-row dumps).

---

## Companies Tab

### What changes
- **Hiring-velocity ranking** — sort companies by active job count + recent posting velocity (jobs added last 14d), not alphabetical.
- **Followed companies** rail at the top — talents can follow an employer; new postings from followed companies surface here and in notifications later.
- **Company card upgrades** — show: logo, name, total active roles, "+N this week" badge, top hiring location, top role type chip (Remote / Full-time / Internship).
- **Company detail drawer** (`/app/jobs/company/:slug`) — opens existing `/app/jobs/all?company=...` route but with a real header: logo, follow button, total roles, location split, role-type split, list of open jobs. Replaces the bare filter view.
- **Search + filter** — keep search; add a "Hiring now" toggle (only companies with ≥1 job posted in last 14d).

### Backend
- New table `followed_companies (user_id, company_name, created_at)` with RLS (own rows only).
- New RPC `get_companies_with_signal(p_country text default null, p_limit int default 100)` returning `{ company_name, logo_url, active_jobs, jobs_last_14d, top_location, top_type }`.
- New RPC `get_company_detail(p_company_name text)` returning header stats + the open jobs list.

---

## Locations Tab

### What changes
- **"Your country" hero card** at top — flag, total active roles, "+N this week", quick CTA "Browse all in [country]".
- **"Working abroad" rail** — top 5 destination countries for talents in your field (uses existing abroad demand signal where possible, else falls back to global top countries by active jobs).
- **Country card upgrades** — show: flag, country name, active jobs, jobs added last 14d, top 3 hiring cities (chips), top hiring company logo strip (max 3).
- **City drill-in** — clicking a city opens `/app/jobs/all?location=...` (already exists, no change), but city chips now show live counts that refresh when expanded.
- **Remote-friendly card** — pin a "Remote-friendly" tile at top (jobs where `is_remote = true`), independent of country.

### Backend
- New RPC `get_countries_with_signal(p_limit int default 50)` → `{ country, flag_emoji, active_jobs, jobs_last_14d, top_cities jsonb, top_companies jsonb }`.
- New RPC `get_remote_friendly_summary()` → `{ active_jobs, jobs_last_14d, top_companies jsonb }`.

Both replace the current client-side group/sort over `jobs` rows (which is hitting the 1000-row cap silently).

---

## Frontend Wiring

### New files
- `src/hooks/useCompaniesWithSignal.ts`
- `src/hooks/useFollowedCompanies.ts` (toggle + list)
- `src/hooks/useCountriesWithSignal.ts`
- `src/hooks/useRemoteFriendly.ts`
- `src/components/jobs/CompanyCard.tsx` (rich variant)
- `src/components/jobs/CountryCard.tsx` (rich variant)
- `src/components/jobs/CompanyDetailSheet.tsx` (drawer for company drill-in) — or upgrade `/app/jobs/all` header when `?company=` is set; will pick during implementation.

### Modified
- `src/pages/app/JobsHub.tsx` — replace Companies and Locations tab JSX with the new components/hooks. Drop the in-page `useMemo` aggregations (`countryGroups`, `companies`).

---

## Out of scope (future sub-phases)
- Company logo upload pipeline / employer claim flow → admin/employer side.
- Notifications for new jobs at followed companies → wire after 3.4.
- Tools tab (3.3) and Job Details/Application (3.4).

---

## Technical notes

```text
Tab layout after 3.2

Companies tab                Locations tab
┌──────────────────────┐     ┌──────────────────────┐
│ [Search] [Hiring now]│     │ Your country (hero)  │
├──────────────────────┤     ├──────────────────────┤
│ Following (rail)     │     │ Remote-friendly      │
├──────────────────────┤     ├──────────────────────┤
│ Top hiring (grid)    │     │ Working abroad rail  │
│  - logo / +N / type  │     ├──────────────────────┤
│                      │     │ All countries (grid) │
└──────────────────────┘     └──────────────────────┘
```

All RPCs `SECURITY INVOKER`, `SET search_path = public`, return only data already exposed by `jobs` RLS (active jobs only).

---

Approve to proceed and I'll run the migration first, then wire the UI.
