
# Gro10x MVP — Finishing Plan

Consolidates everything still open on the Gro10x B2B app so we can hand over to the admin panel work. Five workstreams: **Learn in the nav**, **B2B course catalog + sponsorship**, **Services & Products**, **CRM knowledge base**, and **polish/fixes**.

## 1. Bring "Learn" into the bottom nav (centre slot)

Goal: surface B2B learning as a primary destination, not a hidden link. Profile already moved to the top bar, freeing the slot.

New bottom nav (5 tabs, Learn in the middle):

```text
[ Inbox ] [ Activities ] [ Learn ] [ Feed ] [ Company ]
```

- Update `src/gro10x/components/Gro10xBottomNav.tsx` to 5 items with `GraduationCap` for Learn → `/gro10x/learn`.
- `grid-cols-4` → `grid-cols-5`, keep mobile-first sizing.

## 2. Repurpose `/gro10x/learn` for B2B-only learning

Today `Gro10xLearn.tsx` deep-links into the Talent learning hub. We replace it with a Gro10x-native B2B view that only lists B2B-tagged content, plus company tracks pushed from admin.

UI (single page, three sections):

1. **Assigned to me** — courses the company has pushed to this employee (with a "Sponsored by {company}" pill).
2. **B2B catalog** — all `content` rows where `is_b2b = true`, filterable by track / function.
3. **Company tracks** — multi-course tracks the POC has built for the team (visible to all members; admins can edit from the admin panel).

Reuse existing Talent course detail / player routes (`/app/learning/...`) — single source of truth — but entry happens through the Gro10x shell.

## 3. B2B tagging + company sponsorship (data model)

Schema additions (migration):

- `content` table:
  - `is_b2b boolean default false` — flag courses available in the B2B catalog.
  - `b2b_audience text[] default '{}'` — optional tags (e.g. `sales`, `ops`, `leadership`) for filtering.
- New table `company_course_assignments`:
  - `id uuid pk`, `company_id uuid fk`, `content_id uuid fk`, `assigned_to uuid null` (null = whole company), `due_at timestamptz null`, `sponsorship_mode text check in ('free','company_credits','employee_credits')`, `created_by uuid`, `created_at`.
  - Unique on `(company_id, content_id, assigned_to)`.
- New table `company_course_sponsorships` (ledger of credit grants tied to an assignment):
  - `assignment_id`, `talent_id`, `credits_granted numeric(12,1)`, `granted_at`, `consumed_at`.

RLS:

- `content`: existing public read keeps working. No change.
- `company_course_assignments`: members of the company can SELECT their own assignments; owner/admin manage all.
- `company_course_sponsorships`: company owner/admin + the granted talent can SELECT; only system/admin can INSERT.

Sponsorship modes (per assignment):

- **`free`** — admin-flagged (zero credit cost). The course unlocks for assigned employees regardless of cost.
- **`company_credits`** — at enrollment, the cost is deducted from the **company credit pool** (`company_credits`). No deduction from the employee.
- **`employee_credits`** — company tops up the employee's `contact_bonus_balance` ahead of time (uses existing `contact_bonus_grants` plumbing). Employee then "pays" with bonus credits, keeping the existing per-response/per-enrollment deduction code unchanged.

Resolution order on the employee side stays as already implemented: `contact_bonus → personal balance → earned_balance`.

## 4. Services & Products module (foundation for the CRM knowledge base)

Today `company_services` is just `(company_id, service_key)` — a pick-list of platform services the company has enabled. We extend it into a real catalog so:

- Companies can list what *they* sell (used by Atlas + future sales agent).
- The CRM can attach a deal to a specific service/product.
- Public company page can render an "Offerings" section.

Schema:

- New table `company_offerings`:
  - `id uuid pk`, `company_id uuid fk`, `kind text check in ('service','product')`, `name text`, `tagline text`, `description text`, `price_min numeric`, `price_max numeric`, `currency text`, `unit text` (e.g. `per_month`, `per_project`, `per_unit`), `tags text[]`, `is_active boolean default true`, `display_order int default 0`, `created_by uuid`, timestamps.
  - RLS: members read their own; owner/admin manage; public can read where `is_active = true` AND the parent company is published (mirrors existing public company page rules).
- Extend `company_leads` with optional `offering_id uuid` so a deal can reference what's being sold.

UI (new page `Gro10xOfferings.tsx`):

- Tab inside Activities → "Offerings" (4th tab next to Hiring / Talents / CRM), or a section on the Company page — we'll put a compact list on **both**:
  - Company page: read-only "What we offer" section under About.
  - Activities → Offerings: full CRUD for owner/admin.
- Card form: name, kind, price range, unit, tags, description.

## 5. CRM as a knowledge base for the Sales Agent

The CRM (`company_leads` + `company_lead_activities`) is already in place. We make it agent-consumable.

- Extend `company_leads`: `offering_id uuid null`, `expected_value numeric null`, `expected_close_date date null`, `next_step text null`.
- Extend `company_lead_activities`: ensure `kind` covers `note`, `email`, `call`, `meeting`, `task`, `stage_change`. Add `due_at timestamptz null` for tasks.
- New view `v_company_sales_context` (security invoker): joins lead + latest 5 activities + linked offering — this is the structured payload the future sales agent will read via `company-agent-tools`.
- No new agent yet (per scope: infra first). Just register a `sales` capability in `src/gro10x/lib/agents.ts` so the slot exists.

## 6. Polish & fixes (must-do before handoff)

- **Top bar profile click**: confirm `Gro10xTopBar.tsx` avatar routes to `/gro10x/me` on every page (some pages still expect a separate route).
- **Learn deep-links**: when a course card is tapped from `/gro10x/learn`, open the existing `/app/learning/...` route inside a Gro10x-styled wrapper so the bottom nav stays visible (use `TalentAppShell` swap or render in iframe-less full-page; simpler: navigate out and rely on back).
- **Company page**: surface `company_offerings` + a "Pushed courses" count for owners.
- **Atlas concierge**: extend system prompt context with the company's offerings + open leads summary so it can answer "what are we selling / who's in the pipeline".
- **Bottom nav 5-col spacing**: tighten label sizing so 5 tabs fit at 360px width.
- **Empty states**: Learn (no assignments yet → "Ask your admin to assign a course"), Offerings (no items → "Add your first service").
- **Admin panel hooks (placeholders only — full work happens in the next phase)**: add admin sidebar entries under "B2B" → "Course assignments" and "Company offerings" that render the same components in read-only/all-companies mode using `useAdminScope`.

## Technical details (for engineers)

**Migrations** (1 file, idempotent):

```sql
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS is_b2b boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2b_audience text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS company_course_assignments (...);
CREATE TABLE IF NOT EXISTS company_course_sponsorships (...);
CREATE TABLE IF NOT EXISTS company_offerings (...);

ALTER TABLE company_leads
  ADD COLUMN IF NOT EXISTS offering_id uuid REFERENCES company_offerings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_value numeric,
  ADD COLUMN IF NOT EXISTS expected_close_date date,
  ADD COLUMN IF NOT EXISTS next_step text;

-- Trigger on company_course_assignments INSERT for sponsorship_mode='employee_credits'
-- → insert into contact_bonus_grants (idempotent on (company_id, talent_id, content_id))
-- so the existing award_contact_bonus path tops up the employee.
```

All policies follow project conventions (`is_company_member`, `is_company_admin`, `has_any_admin_role`). All functions: `SECURITY DEFINER`, `SET search_path = public`.

**Files to create**:

- `src/gro10x/pages/Gro10xLearn.tsx` (rewrite)
- `src/gro10x/pages/Gro10xOfferings.tsx`
- `src/gro10x/components/learn/AssignedCourses.tsx`
- `src/gro10x/components/learn/B2BCatalog.tsx`
- `src/gro10x/components/learn/CompanyTracks.tsx`
- `src/gro10x/components/offerings/OfferingForm.tsx`
- `src/gro10x/hooks/useCompanyOfferings.ts`
- `src/gro10x/hooks/useCourseAssignments.ts`
- `supabase/migrations/{ts}_gro10x_b2b_learn_offerings.sql`

**Files to edit**:

- `src/gro10x/components/Gro10xBottomNav.tsx` (5 tabs, Learn middle)
- `src/gro10x/Gro10xRoutes.tsx` (add `/gro10x/offerings`)
- `src/gro10x/pages/Gro10xWork.tsx` (add Offerings tab option OR keep separate route — we'll keep a separate `/gro10x/offerings` route to avoid clutter)
- `src/gro10x/pages/Gro10xCompanyPage.tsx` (render offerings section)
- `src/gro10x/pages/Gro10xCRM.tsx` (link offering, expected value, next step)
- `src/gro10x/lib/agents.ts` (register `sales` slot)
- Admin sidebar + 2 new admin pages (read-only registries)

## Out of scope (deferred to product/agent phase)

- Building the actual Sales Agent or Office Admin Manager agent personas — infra only.
- Course completion analytics dashboards for companies.
- Bulk seat assignment UX (single-user assignment is enough for MVP).
- Stripe-backed company credit top-up flows beyond what already exists.

## Acceptance checklist

- [ ] Learn appears in centre of bottom nav on `/gro10x/*`.
- [ ] `/gro10x/learn` lists B2B-tagged courses + assignments only.
- [ ] Owner can assign a course to an employee with one of three sponsorship modes; credits flow correctly per mode.
- [ ] Owner can add/edit/delete offerings; they appear on the company page.
- [ ] CRM deal can link an offering, expected value, close date, next step.
- [ ] Atlas can answer "what do we sell" and "who's in our pipeline" using the new context.
- [ ] No regressions on existing 4 tabs (Inbox / Activities / Feed / Company).
