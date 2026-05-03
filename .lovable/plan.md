## Admin Sidebar Restructure — Stakeholder Groups 5 & 6

Confirming your brief: the stakeholder order becomes
**1. Overview → 2. Talent → 3. Companies → 4. AI Agents → 5. Investors & High-Value Stakeholders → 6. Institutions & Organizations**, followed by the operational groups (Recruitment, Learning, Marketing, Career Abroad, Monetization, Platform Config).

Agent consoles that currently live as their own tabs in the main dashboard are already mirrored in `/dashboard/chat`, so we remove the duplicates from the sidebar.

---

### 1. Reorder groups in `AdminSidebar.tsx`

Move `Investors & Stakeholders` to position 5 (right after AI Agents) and rename it to **Investors & High-Value Stakeholders**. The current standalone `Stakeholders` group (Institutions / Partner Orgs) is replaced by the richer group #6 below.

### 2. New group: Institutions & Organizations (position 6)

Tabs:
1. **Dashboard** — `inst-overview` (KPI cards: total institutions, active partnerships, upcoming events, leads generated)
2. **Institution Types** — `inst-types` (taxonomy: university, college, school, training partner, accelerator, other — editable list)
3. **Clubs & Affiliated Departments** — `inst-clubs` (linked to a parent institution)
4. **Representatives** — `inst-reps` (point-of-contact people per institution / club)
5. **Events & Competitions** — `inst-events` (events hosted by or co-hosted with these orgs)
6. **Outreach Agent** — opens chat with a new `inst-outreach` agent (mailto-only B2B drafts)
7. **Query Agent (Organizations)** — opens chat with a new `inst-analyst` agent (read-only analytics across institutions, clubs, reps, events)

Reuses the existing `institutions` and `partner_organizations` tables for backing data; new lightweight tables added only for clubs, representatives, and events tied to an institution.

### 3. Remove duplicate agent tabs from the main dashboard

These tabs currently render `AgentRedirectStub` and just push the user to `/dashboard/chat`. Removing them from the sidebar (the chat link at the top is the single entry point):

- Talent group: `talent-aisha`, `talent-ai-general`, `talent-outreach`
- Companies group: `companies-riya`, `companies-ai-general`, `companies-outreach`
- AI Agents group: `agents-manager`
- Investors group: `ir-relationship-exec`, `ir-fpa-agent`

The `Dashboard.tsx` route map keeps the entries (so old deep-links still redirect into chat) but they no longer appear in the sidebar.

### 4. New chat agents in `src/lib/adminAgents.ts`

Add two entries so the new group #6 buttons land in `/dashboard/chat`:
- `inst-outreach` → `admin-inst-outreach` (B2B mailto drafter for universities & partner orgs)
- `inst-analyst` → `admin-inst-analyst` (read-only org analytics)

Edge functions are scaffolded as thin wrappers reusing the same pattern as `admin-talent-outreach` and `admin-aisha-analyst`.

---

### Technical details

**Files to edit**
- `src/components/dashboard/AdminSidebar.tsx` — reorder `navGroups`, rename Investors group, drop redirect-stub items, add new Institutions & Organizations group.
- `src/pages/Dashboard.tsx` — register new tab keys (`inst-overview`, `inst-types`, `inst-clubs`, `inst-reps`, `inst-events`) and their lazy components; keep redirect-stub keys in the map for back-compat.
- `src/lib/adminAgents.ts` — add `inst-outreach` and `inst-analyst`.

**New components** (under `src/components/dashboard/institutions/`)
- `InstitutionsOverviewTab.tsx`
- `InstitutionTypesManager.tsx`
- `ClubsManager.tsx`
- `RepresentativesManager.tsx`
- `OrgEventsManager.tsx`

**Database migration**
- `institution_clubs` (id, institution_id fk, name, department, notes, created_at)
- `institution_representatives` (id, institution_id fk, club_id fk nullable, name, role, email, phone, notes)
- `institution_events` (id, institution_id fk, title, type [event|competition], starts_at, ends_at, location, url, status, notes)
- RLS: admin-only read/write via `has_role(auth.uid(),'admin')`; standard `updated_at` trigger.

**New edge functions** (mirroring existing patterns, both with `verify_jwt = false` + in-function `auth.getUser`)
- `admin-inst-outreach`
- `admin-inst-analyst`

### Out of scope
- No changes to operational groups (Recruitment, Learning, Marketing, Career Abroad, Monetization, Platform Config).
- No data migration of existing `partner_organizations` records — they continue to surface under the existing Stakeholders entry until you ask to merge them into the new group.
