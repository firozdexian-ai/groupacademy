# Phase 3.6 — Employer CRM & Talent Sourcing

3.5 closed the **inbound** hiring loop (applied → hired). 3.6 closes the **outbound** loop: recruiters discover talent, save them to lists, run sourcing pipelines, and track relationships — all inside Gro10x with admin oversight. CRM today (`Gro10xCRM` + `company_leads`) is sales-style B2B leads; we keep that and add a **Talent CRM** stream alongside it, sharing one shell.

Talent-side gaps (saved searches, AI coach) stay out of scope per decision.

---

## Scope

### A. Talent Search (sourcing surface)
New `/gro10x/sourcing` page — Boolean-style search over the public talent pool.

- Filters: keywords, skills (chips), location, years of experience, current title, education, salary expectation band, availability (`open_to_work`), languages, mastery-verified topics.
- Result card: avatar, headline, top 3 verified skills, mastery score, last active, "View profile" + quick actions (Save, Add to list, Message, Invite to job).
- Honors PII rules: only fields the talent set public via `get_public_talent_profile` RPC. Contact details revealed only after talent accepts a connection (existing connection-fee model unchanged — mem: Creator Economy).
- Mobile (≤md): filter sheet + vertical card list.
- Backed by new RPC `search_public_talents(filters jsonb, limit, offset)` returning paginated rows + total count, using existing `talent_skill_profile`, `skill_credentials`, `talent_public_profiles`.

### B. Talent Lists (saved cohorts)
- New table `talent_lists` (`company_id`, `name`, `description`, `created_by`).
- New table `talent_list_members` (`list_id`, `talent_id`, `added_by`, `note`, `added_at`).
- "Save to list" from sourcing results, profile, **and** application kanban cards.
- Lists page at `/gro10x/sourcing/lists` — table of lists, member count, last activity.
- List detail = same talent cards + bulk actions (message, invite to job, move to pipeline).

### C. Talent CRM Pipeline (relationship tracking)
Extend current `Gro10xCRM` from **leads-only** to a tabbed shell:

```text
[ Sales Leads ]   [ Talent Pipeline ]
```

- New table `talent_relationships` (`company_id`, `talent_id`, `stage` enum [`prospect`|`contacted`|`engaged`|`interviewing`|`offered`|`hired`|`passed`|`nurture`], `owner_id`, `source` text, `next_step`, `next_step_at`, `notes`, `created_at`, `updated_at`).
- New table `talent_relationship_activities` (`relationship_id`, `actor_id`, `kind` enum [`note`|`message`|`status_change`|`call`|`email`|`task`], `body jsonb`, `created_at`).
- Kanban same shape as sales CRM. Drag/tap moves stage; logs activity.
- Side sheet: profile snapshot, message thread (reuses 3.5 `application_messages` infra by linking via talent_id when no application exists, OR a new `direct_messages` thread — see Open Q1), notes, activity timeline, "Convert to application" if a relevant role exists.
- Auto-promote rule: when a tracked talent submits an application to one of the company's jobs, the application card in 3.5 kanban shows a **"Sourced"** badge linking back to the relationship.

### D. Company Contacts (B2B)
The existing `company_leads` is generic; split it into a proper **Contacts** entity for B2B intros (clients, partners, investors):

- Rename UX label to **Contacts** (table stays `company_leads` for back-compat); add columns `linkedin_url`, `tags text[]`, `last_contacted_at`, `owner_id`.
- New "Contacts" tab in CRM shell — table view with quick filters, CSV import (recruiter-only).
- Mailto-only outreach (mem: Email Strategy) — never auto-sends from our domain.
- Activity log via existing `company_lead_activities`.

### E. Admin oversight (parallel admin views)
Per the Gro10x + admin pattern from 3.5:

- `/dashboard/admin/sourcing/talents` — admin can search the same pool, see usage analytics per company.
- `/dashboard/admin/sourcing/lists` — read-only roll-up across companies.
- `/dashboard/admin/sourcing/pipeline` — read-only kanban roll-up of `talent_relationships`.
- All read/write actions audited in a new `crm_audit_log`.

### F. Notifications & gating
- Talent gets in-app notification "{Company} added you to their talent pool" only when relationship moves past `prospect` (avoids spam).
- "Invite to apply" sends a directed in-app + email notification with a deep link to the job apply flow.
- Inbox/connection gating reuses existing rules (mem: Creator Economy + Messenger Inbox). Recruiters initiating outreach to a tracked talent consume connection credits per current model — no new economy in 3.6.

### G. Analytics widget (Gro10x Work home)
Small "Sourcing this week" card on `/gro10x/work`:
- New talents saved, messages sent, conversion to application, hires from sourced.
- Powered by new RPC `get_sourcing_stats(p_company_id, p_window_days)`.

---

## Backend

### New tables (all RLS company-scoped via `is_company_member`)
- `talent_lists`, `talent_list_members`
- `talent_relationships`, `talent_relationship_activities`
- `crm_audit_log`

### New RPCs
- `search_public_talents(p_filters jsonb, p_limit int, p_offset int) returns jsonb`
- `get_sourcing_stats(p_company_id uuid, p_window_days int) returns jsonb`
- `link_application_to_relationship(p_application_id uuid)` — trigger helper for the "Sourced" badge

### Triggers
- `trg_application_inserted_link_relationship` — on `job_applications` insert, if a `talent_relationships` row exists for `(company_id, talent_id)`, log activity + flag application as `sourced=true`.
- `trg_crm_audit` — generic audit logger across the new tables.

### Edge functions
- `notify-talent-added` — fires when relationship moves past prospect (in-app only, no email by default).
- `notify-job-invitation` — invite-to-apply (in-app + email + push).

---

## Frontend file plan

### Shared CRM shell
- `src/gro10x/pages/Gro10xCRM.tsx` — refactor into tabbed shell (`Contacts` / `Sales` / `Talent`)
- `src/components/crm/CrmKanban.tsx` (generic, reused by sales + talent)
- `src/components/crm/CrmAuditLog.tsx`

### Sourcing
- `src/gro10x/pages/sourcing/Gro10xSourcing.tsx`
- `src/gro10x/pages/sourcing/Gro10xSourcingLists.tsx`
- `src/gro10x/pages/sourcing/Gro10xListDetail.tsx`
- `src/components/sourcing/TalentSearchFilters.tsx`
- `src/components/sourcing/TalentResultCard.tsx`
- `src/components/sourcing/SaveToListSheet.tsx`
- `src/hooks/useTalentSearch.ts`
- `src/hooks/useTalentLists.ts`
- `src/hooks/useTalentRelationships.ts`

### Admin
- `src/pages/admin/sourcing/AdminTalentSearch.tsx`
- `src/pages/admin/sourcing/AdminTalentLists.tsx`
- `src/pages/admin/sourcing/AdminSourcingPipeline.tsx`
- Register under Admin → Workforce/Jobs group (mem: Admin Groups 7-10)

### Touchpoints
- `src/gro10x/Gro10xRoutes.tsx` — add sourcing routes
- `src/gro10x/pages/Gro10xWork.tsx` — add "Sourcing this week" card
- `src/components/applications/ApplicationKanbanCard.tsx` — render "Sourced" badge when present

---

## Out of scope (later phases)
- Talent-side: saved searches, job alerts, AI application coach (deferred per decision)
- Outbound bulk email campaigns from our domain (mem: Email Strategy keeps B2B mailto-only)
- Calendar / interview scheduling (queued for separate phase)
- Offer letter generation
- Paid "premium sourcing" tier or new credit SKUs — current connection-fee model stays
- A `recruiter` role distinct from company member — existing `is_company_member` check is reused

---

## Open questions

1. **Direct messaging surface** — for talents in the CRM with no application yet, should we (a) create a thin `direct_messages` table and reuse `ApplicationMessageThread` UI keyed by talent_id, or (b) require an "Invite to apply" first so messaging always lives on an application thread? Recommendation: (a) — recruiters need to reach out before there's a role.
2. **Talent visibility consent** — opt-in vs opt-out for appearing in `search_public_talents`? Recommendation: **opt-in via `open_to_work` flag** (already exists) — if false, only profiles explicitly published via `talent_public_profiles` show up. Keeps PII rules tight.
3. **Sourced badge semantics** — should "Sourced" be a hard flag set once, or recompute live? Recommendation: hard flag on insert via the trigger, so the badge survives if the relationship row is later deleted.

Approve to proceed, or tell me which of A–G to drop / reorder.
