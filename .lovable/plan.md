
# Stakeholder Segment 2 — Companies

Mirrors the Talent group structure but for B2B (Gro10x) stakeholders. Reuses `AdminAnalystShell` + analyst edge-function pattern already shipped for Aisha / AI General.

## Sidebar

Rename `Companies & Contacts` → standalone collapsible **`Companies`** group (parallel to `Talent`):

```text
Companies (collapsible)
├── Overview                  (NEW)
├── Companies                 (existing CompaniesManager)
├── Industries                (existing IndustriesManager)
├── Contacts                  (upgraded ContactsManager: Uploaded / Registered tabs)
├── Riya Console              (NEW — B2B auth concierge telemetry)
├── Company AI General        (NEW — in-app messaging to registered company users)
└── Company Outreach Agent    (NEW — outreach to unregistered company contacts/owners)
```

Removes the `Company Agents` row from this group (it stays accessible elsewhere, or moves under AI & Monetization — confirm).

## 1. Companies Overview (`?tab=companies-overview`)

New `src/components/dashboard/companies/CompaniesOverviewTab.tsx`. KPIs:

- Total companies / verified / claimed (have onboarded owner)
- Industry distribution (top 8 + "other")
- Contacts: total / uploaded / registered (linked to `auth.users` via `contacts.user_id`) / matched-from-CV (`source = 'cv_match'`)
- Riya funnel: started → email → role/company → goals → phone → completed (from `riya_conversations` — new table, mirror of `aisha_conversations`)
- Recent admin notifications related to company signups

Same compact KPI card style as `TalentOverviewTab`.

## 2. Companies / 3. Industries

Existing `CompaniesManager` and `IndustriesManager` re-mounted under the new group. No code changes.

## 4. Contacts — upgraded `ContactsManager`

Three sub-tabs (shadcn `Tabs`):

- **Registered** — `contacts.user_id IS NOT NULL` (joined to a Gro10x account).
- **Uploaded** — `contacts.user_id IS NULL` AND `source IN ('manual','batch_upload','admin')`.
- **CV-matched** — `source = 'cv_match'` (auto-suggested from talent CV parsing — see §7).

Each row shows: avatar/initial, name, designation, company (linked), source badge, last contacted, actions (edit, send invite via Outreach Agent, link to user, delete).

Add a "Tag as contact" action on the existing Talent Pool row → inserts into `contacts` with `source='admin'` and pre-fills company from designation match.

## 5. Riya Console (`?tab=companies-riya`)

`src/components/dashboard/companies/RiyaConsoleTab.tsx` using `AdminAnalystShell`. New edge function `admin-riya-analyst` (clone of `admin-aisha-analyst`) with tools:

- `riya_funnel_stats(period)`
- `recent_signups(limit)` — companies created in window
- `stuck_sessions(step)` — sessions that didn't complete
- `signup_notifications()` — pulls `admin_notifications` of type `company_signup`

DB additions:
- `riya_conversations` table — same shape as `aisha_conversations` (`session_id`, `last_step`, `payload jsonb`, `completed_at`, timestamps), RLS admin-only.
- Patch `ai-company-auth-agent` edge function to upsert into `riya_conversations` on every turn (mirror of the Aisha patch).
- Trigger on `companies` insert → `admin_notifications` row of type `company_signup`.

## 6. Company AI General Console (`?tab=companies-ai-general`)

`src/components/dashboard/companies/CompanyAIGeneralTab.tsx` + `admin-company-ai-general-analyst` edge function. Operates on the **registered** company-side users (Gro10x accounts) — analytics + the ability to push in-app messages via existing `messages` / `notifications` infra. Tools:

- `active_company_users(period)` — DAU/WAU on Gro10x routes
- `inactive_users(days)` — for re-engagement
- `send_in_app_message(user_ids[], body)` — uses existing `enqueue_email` + in-app notification helper; logs to `admin_notifications`

## 7. Company Outreach Agent (`?tab=companies-outreach`)

`src/components/dashboard/companies/CompanyOutreachConsoleTab.tsx` + `admin-company-outreach` edge function — parallel of `admin-talent-outreach`, but for **company contacts/owners** not yet on Gro10x. Tools:

- `unregistered_contacts(filter)` — `contacts.user_id IS NULL`
- `cv_matched_contacts(limit)` — surfaced by §7's CV matcher
- `send_invite(contact_ids[], channel)` — uses native email queue with new `company-invite` template (or reuses `talent-invite` until copy approved); logs to new `company_outreach_log` table.
- `recent_outreach(limit)`

DB: `company_outreach_log` (contact_id, channel, sent_at, status, response_at) + RLS admin-only.

## 8. CV → Contacts auto-match (background)

Extend the existing CV parsing pipeline (in `parse-cv` / `auto-review-gig-submission` flow). After a talent is parsed, if the parsed CV exposes `current_company` and `designation` and the company name matches an existing `companies.name` (case-insensitive, trimmed), insert a row into `contacts` with `source='cv_match'`, `company_id = matched.id`, `user_id = talent.auth_user_id` (nullable), `notes = 'Auto-matched from CV upload'`. No-op if a contact already exists for that (email, company_id).

## Verification pass

- All 7 sub-tabs render for `super_admin` and 403 for anon.
- `riya_conversations` populated when a Gro10x signup chat runs (curl smoke test).
- `admin_notifications` fires on new `companies` insert.
- Outreach send writes to `company_outreach_log` and queues a real email via `enqueue_email`.
- Lint / type-check.

## Files

**New**
- `src/components/dashboard/companies/CompaniesOverviewTab.tsx`
- `src/components/dashboard/companies/RiyaConsoleTab.tsx`
- `src/components/dashboard/companies/CompanyAIGeneralTab.tsx`
- `src/components/dashboard/companies/CompanyOutreachConsoleTab.tsx`
- `supabase/functions/admin-riya-analyst/index.ts`
- `supabase/functions/admin-company-ai-general-analyst/index.ts`
- `supabase/functions/admin-company-outreach/index.ts`
- Migration: `riya_conversations`, `company_outreach_log`, `companies` insert → `admin_notifications` trigger, contacts indexes (`user_id IS NULL`, `source`).

**Edited**
- `src/components/dashboard/AdminSidebar.tsx` — promote Companies to a collapsible group with 7 entries.
- `src/components/dashboard/ContactsManager.tsx` — add Registered / Uploaded / CV-matched sub-tabs and "tag as contact" entrypoint.
- `src/components/dashboard/TalentPoolManager.tsx` — add "Tag as contact" row action.
- `src/pages/Dashboard.tsx` — register 4 new lazy routes.
- `supabase/functions/ai-company-auth-agent/index.ts` — upsert `riya_conversations`.
- `supabase/functions/parse-cv` (or equivalent) — emit `contacts` row on company-name match.

## Quick decisions I'll make unless you object

- Keep "Company Agents" tab where it is for now (no move).
- Use `talent-invite` email template for company outreach v1; ship dedicated `company-invite` template in a follow-up.
- Riya logging starts from now (no historical backfill, same as Aisha).
- Seed: none — Industries already curated; contacts populate organically.

## Out of scope (next stakeholder)

- B2B billing / credits dashboards.
- Company-side moderator role permissions overhaul.
