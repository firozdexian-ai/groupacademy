## Pivot: Self-Serve Company Signup (No Approval)

You're right — the approval queue is friction. New plan: anyone with a work email signs up, gets an instant company workspace + **250 free credits**, and lands in `/company` with 1–2 starter AI agents already chatting. Approval queue is removed entirely.

---

## How the new flow works (end-to-end)

```
/for-companies                → marketing landing
/for-companies/signup         → 2-step self-serve signup (NEW, replaces /apply)
   step 1: work email + password + name + phone
   step 2: company name (live-search existing 6,076 companies → pick or create)
            + website + industry + size + country
            → submit
            → server creates auth user, finds-or-creates company,
              creates company_members(owner), grants 250 free credits,
              auto-seeds 1–2 starter agent threads
            → redirect to /company
/company                      → agent inbox, credit balance in header
```

No admin step. No "pending" state. Instant access.

---

## Bugs from current code that still need fixing (carried over)

| # | Issue |
|---|-------|
| B1 | `CompanyRequestsPanel.tsx` calls `supabase.from("n")` and invokes `"n"` — broken stubs. (Will be **deleted** entirely; no more approval panel needed.) |
| B2 | `approve-company-onboarding` writes column `invite_email` but the real column is `invited_email`. (Function will be **deleted**; new self-serve fn uses correct name.) |
| B3 | `approve` always inserts a new company — no dedup against the 6,076 seeded companies. (Fixed via `find_or_create_company` SQL helper in the new flow.) |
| B4 | `companies.is_verified` defaults false; RLS needs it true to show in member SELECTs. (Self-serve fn will set `is_verified=true` on link/create.) |
| B5 | No auto-link from `auth.users` → `company_members`. (Not needed any more — the signup edge fn does both in one transaction with the user's id in hand.) |
| B6 | Country is free text. (Standardized country select in new form — global product memory rule.) |
| B7 | No live company search/dedup in form. (Built into step 2 of new signup.) |
| B8 | "No company access" empty state on `/company` only `mailto:`. (Will deep-link to `/for-companies/signup` + auto-create on first visit if user signed up via `/auth` directly.) |
| B9 | Missing `company-onboarding-approved` email template. (Replaced with a `company-welcome` template — "Your workspace is ready, here are 250 free credits".) |
| B10 | `CompanyPortal.tsx` legacy `font-black uppercase tracking-widest` styling. (Phase 13 cleanup applied.) |

**Critical new finding:** there are currently **0 agents** with `audience='company'` or `'public'` in `ai_agents`. The portal would show an empty sidebar even after perfect signup. We must seed at least 2 starter company agents (see Phase D).

---

## Plan

### Phase A — Self-serve signup edge function & form
1. **New edge fn `signup-company`** (`verify_jwt = false`, public). Body: `{email, password, full_name, phone, company_name, company_id?, website, industry, company_size, country}`.
   - Validate with Zod, block free-email providers (gmail/yahoo/etc — keep this guard).
   - `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata })`.
   - Call `find_or_create_company(...)` → returns company_id, sets `is_verified=true`, enriches missing fields.
   - Insert `company_members { company_id, user_id, role: 'owner', status: 'active' }`.
   - Upsert `company_credits { company_id, balance: 250 }` (only if row didn't exist — never re-grant on subsequent signups for the same company).
   - Optionally insert a `company_credit_transactions` row with reason `welcome_bonus`.
   - Send `company-welcome` transactional email.
   - Return `{ session_email, company_id }` so the client can sign the user in.
2. **New page `/for-companies/signup`** (`src/pages/public/CompanySignup.tsx`) — 2-step wizard:
   - Step 1: account fields (name, work email with free-provider blocking, password, phone with country code).
   - Step 2: live-search `companies` by name (debounced, top 5 with logo/website hint). Pick existing → website/industry/country prefill from record (read-only badges shown as "from our records", user can override missing). "Not in list? Add new" → user fills all fields. Country uses standardized country select.
   - Submit → calls `signup-company` → on success calls `supabase.auth.signInWithPassword` → navigate `/company`.
3. **Landing CTAs** in `ForCompanies.tsx`: change "Request access" → "Get started free" pointing to `/for-companies/signup`. Add a "250 free credits + instant access — no approval needed" badge.

### Phase B — DB helpers & dedup
4. SQL function `find_or_create_company(p_name, p_website, p_industry, p_country)` (SECURITY DEFINER, `search_path = public`):
   - Normalize: lowercase, strip suffixes (Ltd/Inc/Pvt/LLC), normalize website to root domain.
   - Match priority: exact root-domain on website → exact normalized name → trigram similarity ≥ 0.85 (enable `pg_trgm` if missing).
   - On hit: enrich NULL columns only; set `is_verified=true`; return id.
   - On miss: insert new with `is_verified=true`; return id.
5. SQL function `grant_company_welcome_credits(p_company_id uuid)` — inserts/updates `company_credits` to `balance=250` only if row was newly created (idempotent — protects against duplicate grants if multiple owners sign up to same company).

### Phase C — Remove approval pipeline
6. Delete edge fns `submit-company-onboarding`, `approve-company-onboarding`, `reject-company-onboarding`.
7. Delete `src/pages/public/CompanyOnboarding.tsx` and route `/for-companies/apply`.
8. Delete `src/components/dashboard/CompanyRequestsPanel.tsx` and unmount it from the admin dashboard.
9. Drop migration: `DROP TABLE company_onboarding_requests;` (no data — current count 0).
10. Delete `company-onboarding-received.tsx` template + its registry entry.

### Phase D — Seed 2 starter company agents
11. Insert 2 rows into `ai_agents` with `audience='company'`, `is_active=true`, `agent_level=1`:
    - **`company_recruiter`** — "Recruiter Riya" — "Helps you post jobs, screen applicants, and search the talent network."
    - **`company_growth`** — "Growth Advisor Aiden" — "Helps with employer branding, outreach campaigns, and finding the right talent pools."
    Plus their `system_prompt`, `display_order`, and `cost_per_response` (use the existing fractional-credit standard).
12. On first visit to `/company`, the existing `useAgentRuntime` will pick these up (no portal code change needed beyond Phase E polish).

### Phase E — Portal polish
13. `CompanyPortal.tsx`:
    - Add a credit balance pill in the header reading from `company_credits` (subscribe to updates).
    - Replace `font-black uppercase tracking-widest` and the `AGENTIC` neon badge with `uiTokens` styling (Phase 13 consistency).
    - Empty-state CTA: link to `/for-companies/signup`, but if user is already authed and missing membership, show a one-click "Create my company workspace" inline form (reuses Step 2 of signup).
    - Add a small "Company profile" sheet (name, logo upload to existing `companies` table, website edit) so owners can finish their record.

### Phase F — Smoke test (you walk through this)
1. Open `/for-companies/signup` in a logged-out tab.
2. Step 1: use a real work email (not gmail). Step 2: type a company name that **already exists** in our seeded data → pick it from the dropdown → submit. Expect: no duplicate company, `is_verified=true`, you land on `/company` with 250 credits and 2 agent threads visible.
3. Repeat with a brand-new company name → expect fresh `companies` row with verified=true.
4. Try the same email twice → expect "account already exists" error, not double credits.
5. Send a message to "Recruiter Riya" → credits decrement per response.

---

## Technical Section

- **New tables**: none. **Schema changes**: drop `company_onboarding_requests`. Possibly enable `pg_trgm` extension.
- **New SQL functions**: `find_or_create_company`, `grant_company_welcome_credits` (both SECURITY DEFINER, `search_path = public`).
- **New edge fns**: `signup-company` (verify_jwt=false, uses service-role key for admin user creation, Zod validated, free-provider email block, idempotent credit grant). **Deleted**: `submit/approve/reject-company-onboarding`.
- **New email template**: `company-welcome.tsx` ("Workspace ready + 250 free credits") + registry entry. **Deleted**: `company-onboarding-received.tsx`.
- **Seed data**: 2 rows in `ai_agents` with `audience='company'` (need to ship system prompts — I'll write them based on existing agent patterns).
- **RLS**: existing `company_members` "Members view own membership" + `companies` "Company members view own company" policies already cover the new flow once `user_id` is set on the membership row at signup.
- **Files added**: `src/pages/public/CompanySignup.tsx`, `supabase/functions/signup-company/index.ts`, `supabase/functions/_shared/transactional-email-templates/company-welcome.tsx`.
- **Files edited**: `src/pages/public/ForCompanies.tsx` (CTAs), `src/pages/company/CompanyPortal.tsx` (credit pill, empty-state inline create, Phase 13 styling), `src/App.tsx` (replace `/for-companies/apply` route with `/for-companies/signup`), admin dashboard (drop the requests panel).
- **Files deleted**: `src/pages/public/CompanyOnboarding.tsx`, `src/components/dashboard/CompanyRequestsPanel.tsx`, 3 onboarding edge functions, 1 email template.

After approval I'll execute Phases A→E in one pass, then walk you through the smoke test.