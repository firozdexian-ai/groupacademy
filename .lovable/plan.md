
# Gro10x Company Portal — What's Left

## Where we are today (shipped)

- Landing + Riya conversational signup (CV, role, country, phone, goals, password) ✅
- Sign in + post-auth routing (`useAccountType`) ✅
- App shell with bottom nav: Inbox · Feed · Page · Me · Agents ✅
- Agent runtime wired to unified `agent-runtime` with `subject={kind:"company"}` ✅
- Inbox (pin/unread/last-message) + Agent Marketplace (12 agents, goal filter) ✅
- Company Page (banner, tagline/about inline edit, team, open jobs, public slug) ✅
- Feed with member composer + owner draft approval flow ✅
- 18 backend tools live in `company-agent-tools` (jobs, talent search, shortlist, credits, profile, team, drafts) ✅

## What's actually missing (the gaps)

### A. Welcome wizard is a placeholder
`Gro10xWelcome.tsx` just shows "You're in." and dumps to inbox. The promised 5-step onboarding (Profile → Hours → Services → Invites → Agents) is not built. New companies arrive with an empty page and no pinned-agent guidance.

### B. Hire loop is half-wired
- Backend has `create_job / publish_job / list_my_jobs / pause / close / get_job_applicants / search_talent / reveal_talent / save_to_shortlist`.
- UI has **no shortlist screen, no applicants screen, no "my jobs" screen**. Recruiter agent can call these tools but the owner has nowhere to review results outside the chat transcript.

### C. Sell-B2B loop is missing entirely
- No CRM screen (despite `crm` agent existing).
- `lead_hunter`, `outreach` agents have no backing tools registered in `company-agent-tools` (only feed/jobs/talent/credits/profile/team are wired).
- No leads table surfaced in UI.

### D. Billing surface is invisible
- Backend: `get_credit_balance`, `get_ledger`, `start_topup` exist.
- UI: no balance pill in the header, no transactions screen, no top-up CTA. The user can chat with `billing` agent but can't *see* their balance anywhere.

### E. Ops gaps
- `ops` agent exists but `update_company_profile` is the only wired tool. No "company hours / services / locations" tools or UI.
- `calendar` agent has zero backing tools.

### F. Team management is read-only
`list_teammates` and `invite_teammate` exist as tools but the **Page → Team** grid is read-only. Owners can't invite/remove from UI; must go through chat.

### G. Public company page (`/c/:slug`) divergence
`PublicCompanyPage.tsx` exists in `src/pages/public/` — needs a check that it renders the same data the Gro10x in-app page edits (logo, banner, tagline, about, jobs).

### H. Notifications inside Gro10x
No bell, no realtime badge for new applicants, new leads, new draft approvals. `useNotifications` exists on the talent side but not surfaced in the Gro10x shell.

---

## Proposed execution order (4 phases)

**Phase 1 — Close the hire loop (highest leverage)**
1. **My Jobs screen** at `/gro10x/jobs` — list company's jobs (active/paused/closed), edit/pause/close inline.
2. **Applicants drawer** per job — uses `get_job_applicants`, shows match score + reveal CV button.
3. **Shortlist screen** at `/gro10x/shortlist` — saved candidates across jobs, message via Recruiter agent.
4. Add a 5th nav slot or repurpose "Page" sub-tabs to host these (decision point — see Open question 1).

**Phase 2 — Make billing visible**
1. Credit balance pill in Inbox header (taps → `/gro10x/billing`).
2. **Billing screen** at `/gro10x/billing` — current balance, ledger (last 90 days), Top-up CTA → `start_topup` → Stripe.
3. Low-balance toast/banner when < 50 credits.

**Phase 3 — Real Welcome wizard + Team management**
1. 5-step wizard (Logo+Banner → Tagline+About → Hours/Services → Invite teammates → Pin agents). Each step pre-fills from CV/Riya data; all skippable; saves to `companies` + `company_members`.
2. Team management UI on company page (invite by email, role dropdown, remove) — uses existing `invite_teammate` + new `remove_teammate` tool.

**Phase 4 — Sell-B2B + CRM (the big one)**
1. New tables: `company_leads` (status pipeline: new → contacted → qualified → won/lost), `company_lead_activities` (calls/emails/notes).
2. New backend tools: `find_leads` (Lead Hunter), `add_lead`, `update_lead_stage`, `log_activity`, `draft_outreach`.
3. **CRM screen** at `/gro10x/crm` — kanban-style pipeline, filter by owner/agent.
4. Outreach: extend existing `mailto:` flow (per memory, B2B outreach must use `mailto` to protect sender reputation).

**Out of scope for now (parking lot)**
- Calendar agent (needs Google/Outlook OAuth — heavy lift, low signal until pipeline exists).
- In-app notifications bell (defer until Phase 4 ships, then we'll have things worth notifying about).
- Public company page audit (small fix; bundle with Phase 3).

---

## Technical notes

- Add routes under `Gro10xRoutes.tsx` inside the shell-wrapped `<Route element={<Gro10xAppShell />}>` block.
- All new tools go into `supabase/functions/company-agent-tools/index.ts` and must be added to the tool registry the agent runtime consults (so Recruiter/CRM/Lead Hunter agents can call them).
- Realtime: enable `feed_posts`, `company_post_drafts`, and (Phase 4) `company_leads` on `supabase_realtime` for live UI updates.
- All new tables get RLS via existing `is_company_member(company_id)` pattern.
- Stripe top-up reuses the existing `create-checkout` edge function with a `company_credit` mode.

---

## Open questions (need your call before I start)

1. **Navigation**: Bottom nav has 5 slots filled (Inbox/Feed/Page/Me/Agents). For My Jobs / Shortlist / Billing / CRM — do you want (a) replace "Agents" with a "Work" tab containing Jobs+Shortlist+CRM tabs, or (b) keep flat routes and access them via Concierge agent suggestions + header chips?
2. **Phase priority**: Confirm order is Hire → Billing → Welcome+Team → CRM. If you'd rather ship Welcome wizard first (better first-run experience), say so.
3. **CRM scope**: Build a real lightweight CRM (Phase 4 above), or punt and just have Lead Hunter dump prospects to a flat list for v1?

Once you answer these I'll execute Phase 1 first.
