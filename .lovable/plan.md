## Goal

Three concrete fixes + one structural cleanup so the system tells one story:

1. **Talents → Talent App.** B2B people → **Gro10x.** Admin → **internal dashboard.**
2. Every Gro10x signup is visible in Admin → Companies & Contacts.
3. Feed is one shared stream. Companies (via owners) become first-class authors. Their posts appear in both Talent App feed and Gro10x feed.
4. Delete the legacy/experimental B2B surfaces we no longer need.

---

## 1. Make Gro10x signups appear in Admin "Contacts"

**Problem:** Three Dexian users signed up via Gro10x → they exist in `company_members`, but Admin → Contacts reads from a separate legacy `contacts` table (currently empty), so they look invisible.

**Fix:**
- Update `signup-company` edge function to **also upsert a row into `public.contacts`** for every new owner/member: `{ company_id, full_name, email, phone, designation = role from CV (if any), source = 'gro10x_signup', is_primary = true for the first owner }`.
- Add a backfill SQL migration that inserts a `contacts` row for every existing `company_members` user that doesn't already have one (joined via `auth.users` for email/name).
- Add a DB trigger on `company_members` (after insert) that calls a `SECURITY DEFINER` function to upsert a matching `contacts` row — so any future path (invites, admin-created members, etc.) stays in sync.
- In `ContactsManager.tsx`, add a **"Source"** column + filter chip (Manual / LinkedIn Import / Gro10x Signup) and a green "Active Gro10x user" badge when the contact's email matches a `company_members.user_id`.
- In Admin → Companies, show a small **"X active Gro10x users"** badge per company row.

## 2. One feed, two surfaces, company-as-author

**Current state:** `feed_posts` already has `author_type ∈ {user, company, admin}` and `author_company_id`. Gro10x feed and Talent feed both read from `feed_posts`. The plumbing exists; we just need to use it end-to-end.

**Fix:**
- **Gro10x composer** (already drafts via `company-agent-tools.draft_company_post`) — when an **owner** publishes, the resulting `feed_posts` row is written with `author_type = 'company'`, `author_company_id = <company>`, `author_name = company.name`, `author_avatar = company.logo_url`. (Confirm this in `company-agent-tools/index.ts` `publish_company_post` handler; patch if it currently writes `author_type = 'user'`.)
- **Talent app `Feed.tsx`** — render a small "Company" pill + clickable company logo on posts where `author_type = 'company'`, linking to `/c/:slug` (the public company page).
- **Members vs owners** in Gro10x:
  - `owner` / `admin` → can publish company posts directly (also approve drafts).
  - regular member → composer creates `company_post_drafts` row for owner approval (already wired).
- **Admin moderation:** Admin → Marketing & Outreach → "Feed Posts" already lists everything; add a "Company posts" filter and an "Unpublish" action that flips `is_active = false`.

## 3. Consolidate / delete duplicate B2B surfaces

We currently have **three** overlapping B2B entry points. Keep one canonical path.

**Keep:**
- `/gro10x` (landing) → `/gro10x/auth` (Riya conversational signup) → `/gro10x/inbox`
- `/c/:slug` — public company page (SEO-facing, shareable)
- `/company` — kept as a **redirect** to `/gro10x` for any old bookmarks
- Admin dashboard at `/dashboard` (unchanged)

**Delete / retire:**
- `src/pages/public/CompanySignup.tsx` (legacy form-based signup) — redirect `/for-companies/signup` → `/gro10x/auth`.
- `src/pages/public/ForCompanies.tsx` (legacy marketing page) — redirect `/for-companies` → `/gro10x`.
- `src/pages/company/CompanyPortal.tsx` — replace contents with a thin redirect to `/gro10x`. (Keep the file/route alive only as a redirect for one release; remove next pass.)
- Remove the matching nav links/CTAs from the talent marketing site so there is one B2B funnel.

## 4. Clarify who lives where

- **Talent App (groupacademy.online + /app/\*):** individuals, learners, jobseekers. **No company contact onboarding here.** Signup stays as-is.
- **Gro10x (gro10x.\* host + /gro10x/\*):** every B2B user — first contact becomes `owner`, can later promote others. Roles mirror LinkedIn-style pages: `owner`, `admin`, `editor`, `member` (extend the `company_members.role` check constraint accordingly; default invitees = `member`).
- **Admin Dashboard (/dashboard):** internal GroUp Academy / Gro10x staff only. Surfaces every company + every contact (whether imported manually, scraped from LinkedIn, or self-signed-up via Gro10x).

---

## Technical notes

**DB migration**
```sql
-- 1. Extend role enum-ish check to include editor/member
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_role_check;
ALTER TABLE company_members ADD CONSTRAINT company_members_role_check
  CHECK (role IN ('owner','admin','editor','member'));

-- 2. Add source + linked user_id to contacts (idempotent upserts)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_detail text;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_company_user_uq
  ON contacts(company_id, user_id) WHERE user_id IS NOT NULL;

-- 3. Sync trigger: company_members → contacts
CREATE OR REPLACE FUNCTION public.sync_member_to_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record;
BEGIN
  SELECT email, raw_user_meta_data INTO u FROM auth.users WHERE id = NEW.user_id;
  IF u.email IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.contacts (company_id, user_id, full_name, email, phone, designation, source, is_primary)
  VALUES (
    NEW.company_id, NEW.user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    u.email,
    u.raw_user_meta_data->>'phone',
    NEW.role,
    'gro10x_signup',
    NEW.role = 'owner'
  )
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET designation = EXCLUDED.designation, updated_at = now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_member_to_contact ON company_members;
CREATE TRIGGER trg_sync_member_to_contact
  AFTER INSERT ON company_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_member_to_contact();

-- 4. Backfill existing 4 rows
INSERT INTO contacts (company_id, user_id, full_name, email, phone, designation, source, is_primary)
SELECT cm.company_id, cm.user_id, COALESCE(u.raw_user_meta_data->>'full_name', u.email),
       u.email, u.raw_user_meta_data->>'phone', cm.role, 'gro10x_signup', cm.role='owner'
FROM company_members cm JOIN auth.users u ON u.id = cm.user_id
WHERE cm.user_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;
```

**Edge function patches**
- `signup-company`: after inserting `company_members`, the trigger above handles contacts — no app code change needed beyond verifying the trigger fires.
- `company-agent-tools/index.ts` → `publish_company_post`: ensure insert sets `author_type='company'`, `author_company_id`, `author_name = company.name`, `author_avatar = company.logo_url`.

**Frontend changes**
- `src/components/dashboard/ContactsManager.tsx` — Source filter chip + "Active Gro10x" badge (compute via join to `company_members`).
- `src/components/dashboard/CompaniesManager.tsx` (or equivalent) — show count of active Gro10x members per row.
- `src/pages/app/Feed.tsx` — render company author pill when `author_type='company'`, link to `/c/:slug`.
- `src/App.tsx` — replace `/for-companies`, `/for-companies/signup`, `/company`, `/company/*` route elements with `<Navigate to="/gro10x" replace />` (signup goes to `/gro10x/auth`).
- Delete `src/pages/public/CompanySignup.tsx`, `src/pages/public/ForCompanies.tsx`. Trim `CompanyPortal.tsx` to a redirect.
- Remove "For Companies" links from the talent marketing nav/footer; keep a single "Are you a business? → Gro10x" button.

**RBAC unchanged**
- `useAccountType` already routes `company` → `/company`; update its default to `/gro10x` for company accounts so post-auth lands them in the right PWA.

---

## Out of scope (next iterations)

- Teammate invitation UX inside Gro10x (`POST /companies/:id/invite`)
- Stripe top-up flow inside Gro10x
- Per-role permission UI (promote/demote member ↔ admin ↔ owner)

These three are queued right after this consolidation lands.