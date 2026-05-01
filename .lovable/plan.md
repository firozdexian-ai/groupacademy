## Vision: **Gro10x** — the professional WhatsApp, powered by AI agents

Reframe of the whole B2B side. Not "company workspace" — a **professional super-app** where every business contact has a personal profile + a company page, and gets things done by chatting with agents.

---

## 1. Riya's signup script (revised — CV-first, role-aware)

She still asks 7 things, but the order is tuned so we can recommend agents at the end:

```text
1.  Email                  (work email; block free providers)
2.  Full name
3.  Upload your CV         "Drop your CV — I'll read it so we don't waste your time on forms."
                           → parse-cv edge fn fills role, seniority, skills, current company
4.  Confirm role + company "Looks like you're Head of Talent at Acme. Right?"
                           → user can correct one-tap; if no CV, Riya asks role + company manually
5.  What brings you here?  multi-pick chips (drives Stage-2 agent suggestions):
                             • Hire people
                             • Find freelancers / gigs
                             • Sell to companies (B2B outreach)
                             • Train my team
                             • Run ops / billing / admin
                             • Just exploring
6.  Country + phone        (one combined step, country-coded input)
7.  Human check + password (Aisha-style quiz inline, then password)
   ↓
   signup-company → creates:
     • auth user with account_type='company'
     • talents row (yes — same table; a contact IS a person with a CV)
     • companies row (find_or_create_company on confirmed name)
     • company_members row (role='owner' if first member, else 'member')
     • personalized agent shortlist based on step 5 answers
```

**Key insight you raised**: a company contact is also an individual professional. We **reuse `talents`** for their CV/profile and link via `company_members.user_id`. One person, two surfaces:
- Their **personal profile** (CV, skills, posts) — visible to teammates and, optionally, the public
- Their **company page** (org-level info) — shared by all employees

---

## 2. First-contact = owner, rest = members

```text
company_members.role:
  'owner'  → first signup at that company. Full edit on company page, billing, invites
  'admin'  → promoted by owner. Same as owner minus billing + delete
  'member' → joins via invite or matched email domain. Edit own profile, post to feed,
             use agents, view company page (read-only)
```

When person #2 signs up with `@acme.com` and Acme already exists:
- Riya: "Acme already has a workspace, owned by Sarah. Want to request to join?"
- Creates `company_members` row with `status='invited'` → owner gets an in-app notification + email
- Owner one-click approves → status='active'

No more "no company workspace" dead-end.

---

## 3. Shared, editable Company Page

New page at `/company/page/:companyId` (and `/company/page` for own).

**Sections** (all inline-editable by owner/admin, read-only for members):
- Banner + logo + tagline + about (AI-draft button)
- Team grid (avatars from `company_members` joined to `talents`)
- Open jobs (auto-pulled from `jobs` table)
- Services we offer / need (from `company_services`)
- Posts by company (see #5)
- Contact info (website, LinkedIn, email, hours)

Public version at `/c/:slug` — SEO-indexed, used as outreach landing.

---

## 4. Personal Profile inside Gro10x

`/professional/me` — same data as talent profile but with a **B2B framing**:
- Headline ("Head of Talent @ Acme")
- About + CV download
- Posts authored by this person
- Companies they belong to (multi-company support — same user can be member of 2 companies)
- "Message me on Gro10x" deep-link button (goes to /messages thread with this user)

---

## 5. Agent-authored Feed posts

Currently the talent feed lets users post. Extend to Gro10x:
- Member chats: *"Growth Agent, post on the company feed: we just hired 3 engineers, link to careers page"*
- Growth Agent drafts post → shows preview card → member taps **Confirm** → publishes to `feed_posts` with `author_type='company'` and `author_company_id`
- Company posts appear in members' personal feeds and on `/c/:slug` public page
- Optional: cross-post to LinkedIn via mailto/share-sheet (no API integration — per your B2B mailto strategy)

Same for personal posts — *"Riya, post: thrilled to join Acme as Head of Talent"* → drafts → publishes under personal handle.

---

## 6. The agent shortlist (driven by signup step 5)

After Riya finishes, the user lands in `/gro10x/inbox` (the WhatsApp clone) with **only the agents that match their goals pre-pinned**:

| Goal selected | Pre-pinned agents |
|---|---|
| Hire people | Recruiter, Sourcer, Outreach |
| Find freelancers | Gig Finder, Briefing, Escrow |
| Sell to companies | Lead Hunter, Outreach Writer, CRM |
| Train my team | Curriculum, Cohort Manager, Progress Tracker |
| Run ops/billing | Billing, Ops, Calendar |
| Just exploring | Concierge only |

The rest live in **Agent Marketplace** (`/gro10x/agents`), addable any time. This is exactly what you wanted: "find which agents he/she requires most."

---

## 7. Gro10x as a separate PWA

Two installable PWAs from the **same codebase**, switched by hostname:

| Domain | App name | Manifest | Start route | Theme |
|---|---|---|---|---|
| `groupacademy.online` | GroUp Academy | existing | `/` | current |
| `gro10x.app` (or `app.gro10x.com`) | **Gro10x** | new | `/gro10x` | brand-new dark/glass theme |

**How**:
- One React build, host-aware root: `if (host.includes('gro10x')) → mount Gro10xApp` else → existing.
- Two `manifest.webmanifest` files served conditionally by Lovable's hosting based on host header (or `/manifest-gro10x.webmanifest` linked from a Gro10x-only `index-gro10x.html` — simplest path: a tiny `useEffect` that swaps the `<link rel=manifest>` href and theme-color on mount when host matches).
- Service worker stays single (kill-switch friendly), with `start_url` resolved from current host so installs lock to the right shell.
- Icons + splash: new Gro10x set in `/public/gro10x/`.
- App name in manifest: **"Gro10x — Professional AI"**.
- Display: `standalone`, theme `#0B1220`, accent `#33E1E4` (your existing Vibrant Cyan, but on near-black to feel "pro tool" vs talent's lighter feel).

Result on a contact's phone: they install Gro10x, and the icon opens straight to **the inbox of agents** — feels like WhatsApp Business but every contact is an AI that does work.

---

## 8. Routing inside Gro10x

```text
/gro10x                  → redirect to /gro10x/inbox (or /welcome if onboarding pending)
/gro10x/welcome          → 5-step company onboarding wizard (skippable steps)
/gro10x/inbox            → list of agent threads (left rail on desktop, full screen mobile)
/gro10x/c/:agentId       → chat with one agent
/gro10x/feed             → company + network feed
/gro10x/agents           → agent marketplace
/gro10x/page             → my company page (editable)
/gro10x/page/:companyId  → other company pages
/gro10x/me               → my professional profile
/gro10x/team             → invites + member list
/gro10x/billing          → credits, top-up, invoices
```

Nav: bottom tab bar on mobile (Inbox · Feed · Page · Me), left rail on desktop.

---

## 9. What we're building (file list)

**DB migration**:
```sql
alter table companies
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists tagline text,
  add column if not exists slug text unique;

create table company_services (
  company_id uuid references companies(id) on delete cascade,
  service_key text not null,
  primary key (company_id, service_key)
);

alter table feed_posts
  add column if not exists author_type text default 'user',  -- 'user' | 'company'
  add column if not exists author_company_id uuid references companies(id);

-- talents already has cv_url, skills, experience — reused as-is for B2B contacts
```

**Edge functions**:
- `ai-company-auth-agent` (Riya — CV-aware, goal-aware)
- `gro10x-agent-tools` (extends existing `company-agent-tools` with feed-post action)

**New pages/components**:
- `src/gro10x/` — whole subtree (Inbox, ChatPane, Feed, CompanyPage, Profile, AgentMarketplace, Welcome wizard, BottomNav)
- `src/pages/public/Gro10xAuthChat.tsx` at `/gro10x/auth`
- `src/lib/host.ts` — detects gro10x vs academy, exports `IS_GRO10X`
- `src/main.tsx` — branches on `IS_GRO10X` to load Gro10x manifest + theme
- `public/gro10x/manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`

**Edits**:
- `vite.config.ts` — add second manifest entry; both apps share the SW with route allowlist
- `index.html` — host-aware manifest link via small inline script (before React mounts)
- `src/App.tsx` — top-level: if `IS_GRO10X` render `<Gro10xApp/>` else current routes
- `useAccountType.ts` — already fixed; ensure `account_type='company'` users on academy host get a "Open in Gro10x" banner instead of being dropped into talent feed

---

## 10. The journeys, one-line each

- **New contact, new company** → Riya (CV upload + goals) → Welcome wizard → /gro10x/inbox with curated agents → first chat = Recruiter or Concierge
- **New contact, existing company** → Riya detects domain → "Join Acme?" → request → owner approves → lands in inbox as member
- **Returning contact** → Riya recognizes email → password → /gro10x/inbox (or /welcome if incomplete)
- **Owner posts via agent** → chats Growth Agent → drafts → confirms → live on company feed + public page
- **External viewer** → visits `/c/acme` → sees company page → "Message us" → opens Gro10x install prompt or web chat with company's Concierge agent

---

## Acceptance test
1. Visit `gro10x.app` on phone → install prompt shows "Gro10x" with cyan/dark icon
2. Tap "Get started" → Riya chat → upload CV → confirm role → pick "Hire people" → password → land in inbox with Recruiter pinned
3. Chat Recruiter "post a job for a React dev" → JD drafts → confirm → job live + auto-posted to company feed
4. Open `/gro10x/page` → edit tagline inline → save → public `/c/your-slug` reflects change
5. Invite teammate → they sign up with same domain → auto-suggested to join → owner approves → they appear on company page

---

## Out of scope for v1 (fast follows)
- Multi-company switcher UI (data model supports it; switcher comes later)
- Real LinkedIn auto-post (stays mailto/share-sheet for now per existing strategy)
- Native iOS/Android Capacitor build (PWA first; Capacitor wrap later if needed)
- Stripe team-seat billing (single-company billing first)