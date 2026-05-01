## Public B2B Company Funnel

Build a discoverable, self-serve onboarding path for companies — so they can learn about the offering, request access, and get auto-provisioned into the Company Portal.

### 1. Public Landing Page — `/for-companies`

New route `src/pages/public/ForCompanies.tsx`:
- Hero: "Hire pre-vetted talent + AI agents for your team"
- Value props (3-up): Talent pipeline, AI Career Agents for employees, Managed gigs
- How it works (4 steps): Request access → Approval → Invite team → Post jobs/agents
- Pricing teaser (link to credits) + testimonial slot
- Two CTAs: "Request Company Access" (opens onboarding form) + "Talk to sales" (mailto)
- SEO: JSON-LD Organization + canonical to root domain (per global SEO rule)

### 2. Public Onboarding Form — `/for-companies/apply`

New route `src/pages/public/CompanyOnboarding.tsx` (no auth required):
- Fields: Company name, website, industry, size, country, contact name, **work email** (validated, no free providers warning), phone (mandatory global format per Core rule), use case (textarea), heard-from
- Zod validation client + server
- Submits to new edge function `submit-company-onboarding` which:
  - Validates payload
  - Inserts into new `company_onboarding_requests` table (status: `pending`)
  - Sends transactional confirmation email to applicant via native queue
  - Notifies admins (insert into existing notifications or email)
- Success screen: "We'll review within 1 business day. Check your inbox."

### 3. Admin Approval Workflow

New tab in Dashboard → "Company Requests" (`src/components/dashboard/CompanyRequestsPanel.tsx`):
- Table of pending/approved/rejected requests
- Row actions: **Approve** (creates `companies` row + pre-invites contact email as `owner` in `company_members` — existing trigger auto-links on signup), **Reject** (with reason), **View details**
- Approval triggers transactional email: "You're approved — sign up here" with link to `/auth?company_invite=<id>`
- Rejection triggers polite decline email

### 4. Public Discoverability

- Add "For Companies" link to public navbar (`src/components/Navbar.tsx` or equivalent landing nav)
- Add to footer
- Add link from `/auth` page ("Hiring? Apply for company access →")

### Database changes

```sql
create table public.company_onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  website text,
  industry text,
  company_size text,
  country text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  use_case text,
  heard_from text,
  status text not null default 'pending', -- pending|approved|rejected
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  approved_company_id uuid references public.companies(id),
  created_at timestamptz default now()
);
alter table public.company_onboarding_requests enable row level security;
-- Public can INSERT only; admins can SELECT/UPDATE
create policy "anyone can submit" on public.company_onboarding_requests
  for insert to anon, authenticated with check (true);
create policy "admins manage requests" on public.company_onboarding_requests
  for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
```

### Edge functions

- `submit-company-onboarding` (verify_jwt=false, public): zod validation, insert request, enqueue confirmation email
- `approve-company-onboarding` (auth required, admin only): creates company + pre-invite member, enqueues approval email
- `reject-company-onboarding` (auth required, admin only): updates status, enqueues decline email

### Files to create/edit

**Create:**
- `src/pages/public/ForCompanies.tsx`
- `src/pages/public/CompanyOnboarding.tsx`
- `src/components/dashboard/CompanyRequestsPanel.tsx`
- `supabase/functions/submit-company-onboarding/index.ts`
- `supabase/functions/approve-company-onboarding/index.ts`
- `supabase/functions/reject-company-onboarding/index.ts`
- Migration for `company_onboarding_requests`

**Edit:**
- `src/App.tsx` — add public routes
- `src/pages/Dashboard.tsx` — add "Company Requests" tab
- Public navbar + footer — add "For Companies" link
- `src/pages/Auth.tsx` — add discoverability link

### Out of scope (future)

- Self-serve Stripe billing for companies (separate phase)
- Company team invite UI inside the portal (already partially in CompanyPortal)

Approve to implement?