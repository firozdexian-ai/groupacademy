# Gro10x + Admin Portal — Infrastructure-First MVP

## Corrected mental model (the whole ecosystem)

```text
┌──────────────────────────────────────────────────────────────────┐
│                       ONE BACKEND · ONE CREDIT ECONOMY (USD)     │
└──────────────────────────────────────────────────────────────────┘
       │                          │                          │
       ▼                          ▼                          ▼
 groupacademy.online/app     gro10x.com               groupacademy.online/admin
 (TALENT portal)             (B2B super-app)          (ADMIN portal — ONE app)
 Talent users                Employees + POC          Super Admin
                             (Company Admin)          + Internal Team
                                                      + Company Admin (impersonation)
```

- **Three portals, not five.** Admin portal serves super-admin, internal team, AND company admins (role-aware views inside the same `/admin` shell).
- **Gro10x is part of the ecosystem**, not a separate codebase. Reuses the same DB, credits, agents, and learning content.
- **Credit economy = USD base.** All admin/founder views in USD. Talent/company users see USD with a localized equivalent (e.g. "$5 ≈ ৳550") based on country.
- **Don't rebuild the existing admin panel** — refine and extend it for three roles.
- **Don't deep-design agents now.** Build infrastructure; agents come in the next initiative.

## Stakeholder → portal map (locked)

| Stakeholder | Portal | Access mechanism |
|---|---|---|
| Talent | `/app` | Existing |
| Employee / POC (Company Admin in Gro10x) | `gro10x.com` | Existing shell |
| Company Admin (managing company settings/agents/billing) | `/admin` (scoped view) | Login → company-scoped sidebar |
| Internal Team / Manager | `/admin` (scoped view) | Login → ops sidebar, can impersonate companies |
| Super Admin (`growthnxnow@gmail.com`) | `/admin` (full) | All groups visible |
| Investors / Institutions / Clubs | Tracked as data inside `/admin` | No portal of their own |

## Infrastructure to build (no agent work, no GTM)

### Block A — Currency & credit economy normalization
1. Make **USD the base unit** everywhere in DB and UI labels. Add `usd_amount` columns where credits → money is shown. Keep the existing `numeric(12,1)` credit fields.
2. New table `currency_rates(code, usd_rate, updated_at)` seeded with ~20 major currencies. Daily refresh via scheduled edge function (cron) — placeholder static seed for v1, real fetch later.
3. Helper `formatMoney(usdAmount, userCountry)` → returns `"$5.00 (≈ ৳550)"`. Use it on every credit/price label across all three portals.
4. Founder/super-admin dashboards show **USD only**. Talent + company users see **USD + local equivalent**.

### Block B — Three-role admin portal architecture
1. Extend `app_role` enum / `user_roles` so the existing roles (`admin`, `super_admin`, `staff`, etc.) cleanly map to:
   - **super_admin** — sees all 10 sidebar groups
   - **internal_team** (alias for `staff`/`talent_exec`/`content_lead`) — sees ops groups only, no platform settings
   - **company_admin** — sees only their own company's groups (Page, Team, Billing, Agents, Jobs, Leads, Analytics) scoped by `company_id`
2. **`AdminSidebar.tsx`**: filter `navGroups` by resolved role. Add a `companyScoped: boolean` flag to each group; for `company_admin` only `companyScoped` groups render.
3. **Impersonation foundation**: super-admin/internal-team can "Open as Acme Corp" → sets `acting_company_id` in localStorage + a JWT custom claim. Server-side helper `current_company_context()` returns either the user's own membership or the acting company (after verifying the user has admin/staff role). Top banner: "Acting as Acme Corp · Exit".
4. **Login routing**: extend `useAccountType` → returns `{ accountType, adminScope: 'super' | 'internal' | 'company' | null }`. Post-auth router lands company_admins on `/admin?company={their_id}`, internal team on `/admin`, super admin on `/admin`.

### Block C — Company self-service infrastructure (no forced fields)
1. **Profile completion %**: computed column / view scoring `companies` row across ~10 fields (logo, banner, tagline, about, website, country, industry, address, hours, services). Surface as a ring badge on Company Page + a "Complete your profile" card.
2. **Verification tiers**: `companies.verification_tier enum('unverified','self_completed','verified')`. Auto-promote to `self_completed` when profile_completion ≥ 80%. `verified` is manual by internal team.
3. **Editability**: every field on `companies` is owner-editable from Gro10x Company Page. No admin gating except the verification badge itself.
4. **Gamification hook** (UI only — actual rewards later): "Reach 100% to unlock the Verified Company badge."

### Block D — Gro10x portal completion (the missing pieces only)
Skip welcome wizard heaviness — the profile completion % above replaces it. Ship only what unlocks the loop:
1. **Billing visibility**: header credit pill + `/gro10x/billing` (balance, 90-day ledger, top-up CTA via existing `start_topup` → Stripe). All amounts shown as **USD (≈ local)**.
2. **Team management UI** on Company Page: invite by email, role dropdown, remove (uses existing `invite_teammate` + new `remove_teammate` tool).
3. **B2B Learning tab inside Gro10x**: new `/gro10x/learn` route that reuses the existing Learning Hub (talent side) but scoped to company-shared content. Reuses `enrollments`, `course_modules`, `learning_activity`. Discoverable agents/courses can be link-shared into Inbox threads (already supported infra).
4. **Realtime** on `feed_posts`, `company_post_drafts`, `job_applications`, `company_credit_transactions`.
5. **In-app notifications bell** in Gro10x shell — reuse existing `useNotifications`.

### Block E — CRM + leads infrastructure (data layer only, agent-ready)
Build the schema + tools so Lead Hunter / CRM agents have something to call when we work on agents next.
1. New tables: `company_leads` (pipeline status), `company_lead_activities` (calls/emails/notes). RLS via `is_company_member` + `current_company_context()`.
2. New backend tools in `company-agent-tools`: `find_leads`, `add_lead`, `update_lead_stage`, `log_activity`. Register in agent runtime.
3. **`/gro10x/work` 3rd tab — CRM kanban** (basic UI; agent integration later).
4. Outreach via `mailto:` only (per memory rule).

### Block F — Stakeholder registries inside `/admin` (data infrastructure)
So the admin portal can later manage them — no public portals built:
1. **Institutions & Organizations**: new table `institutions(id, name, type enum('university','school','club','company','ngo','other'), country, website, verified)` + admin CRUD UI under a new sidebar group.
2. **Investors**: already exists in IR module — confirm it's reachable only by super_admin + internal_team (not company_admin scope).
3. **AI Agents registry**: already exists (`ai_agents`). Confirm RBAC scoping — super_admin manages global agents, company_admin manages only `company_agents` for their company.

## Execution order (infrastructure only — ~5 cycles)

1. **Block A — Currency/USD base** (~0.5 cycle) · foundation for everything else
2. **Block B — Three-role admin portal** (~1 cycle) · unlocks company-admin self-serve
3. **Block C — Profile completion + verification** (~0.5 cycle)
4. **Block D — Gro10x billing + team + learn tab + bell** (~1 cycle)
5. **Block E — CRM data layer + tools** (~1 cycle)
6. **Block F — Institutions registry + RBAC audit** (~0.5 cycle)
7. **Cross-cutting polish** (~0.5 cycle) · realtime, empty states, mobile QA at 390×844

After this, the **agents initiative** begins (one agent at a time), then **products/categories/GTM**.

## Technical notes

- All currency display goes through one helper to avoid drift; founder dashboards bypass localization.
- `current_company_context()` is the single source of truth for "which company am I acting on" — every RLS policy and edge function reads from it.
- Profile completion % is a generated/computed column to avoid drift.
- Reuse: Gro10x Learning tab is a thin wrapper around the existing talent-side Learning Hub components (per the Learning Hub Tabs memory). No new course infra.
- No new payment integration — existing Stripe top-up + `create-checkout` handles USD natively.
- The existing `AdminSidebar.tsx` 10-group hierarchy is preserved; we add filtering, not restructuring.

## Out of scope for this initiative (parking lot)

- Agent-by-agent build (next initiative, per your direction)
- Products / categories / GTM (after agents)
- Office Admin Manager / attendance agent
- Calendar OAuth (Google/Outlook)
- Real currency-rate API (static seed for v1)
- Public portals for investors/institutions

## Decisions needed before I start Block A

1. **Localized currency display** — show on talent + company portals only (founder dashboards stay USD-only), correct?
2. **Company admin login routing** — when a company-admin signs in, land them in `/admin` (settings-first) or `gro10x.com` (operations-first) by default? My recommendation: `gro10x.com` for daily ops, with a clear "Open admin settings" link.
3. **Verification tier rewards** — gamify with UI badges only for v1, or also tie a credit bonus (e.g. +50 credits at "verified")? Suggest UI-only for v1.

Answer these and I'll start with Block A (currency normalization).