## Why Signup Failed

`signup-company` exists in code and the database is fully wired (functions, agents, tables all present), but **the function has zero invocation logs** — it hasn't been deployed to runtime yet. First action of this plan re-deploys it and surfaces the real error in the toast (currently swallowed as "edge function failed").

---

## Plan: Company Portal v1 — Pure Chat + Canvas, WhatsApp-Business Style

No tabs. No tables. No forms outside chat. Every workflow is a conversation with an agent. When an agent needs to show structured output (job preview, talent card, invoice, profile editor) it opens a **canvas pane** beside the chat — same pattern already used in `useAgentRuntime` for the talent side.

### Layout (single screen, no tabs)

```text
/company
┌─────────────┬──────────────────────────┬───────────────────┐
│ Agent List  │  Active Conversation     │  Canvas (toggle)  │
│ (WhatsApp)  │  (markdown chat stream)  │  Job draft / CV / │
│             │                          │  invoice / profile│
│ Recruiter   │  > Post a senior react   │                   │
│ Riya •      │    role in Berlin        │  [Live preview    │
│ Growth      │  Riya: Here's a draft… → │   of what the     │
│ Aiden       │  [Open in canvas]        │   agent built]    │
│ Talent Scout│                          │                   │
│ Maya        │                          │                   │
│ Billing     │                          │                   │
│ Bilal       │                          │                   │
│ Ops Omar    │                          │                   │
└─────────────┴──────────────────────────┴───────────────────┘
```

Canvas slides in from the right when the agent emits a structured artifact, slides out when not needed. Mobile: canvas takes full screen with a back button (per mobile design system memory).

### The Five Company Agents

Already seeded: **Recruiter Riya**, **Growth Aiden**. Add three more so every B2B job is owned by a conversational persona:

| Agent | Owns | Canvas Artifacts |
|-------|------|------------------|
| Recruiter Riya | Job posting, edits, pause/close, applicant review | Job draft editor, applicant shortlist |
| Talent Scout Maya | Search talent DB, filter by skill/country, reveal PII | Talent card, saved shortlist |
| Billing Bilal | Credit balance, ledger, top-up, invoices | Ledger view, Stripe checkout link |
| Ops Omar | Company profile, hours, locations, team invites | Profile editor, member list |
| Growth Aiden | Strategy, market trends, JD writing tips | Insight cards, JD templates |

### Agent Tool Inventory (what each agent can actually do)

Server-side tools registered to each agent, called via the existing tool-calling loop:

- `create_job(title, location, skills, salary, …)` → returns draft, opens canvas
- `publish_job(job_id)` → deducts credits, returns confirmation
- `list_my_jobs(status?)` → renders inline list with quick actions
- `search_talent(filters)` → returns redacted cards
- `reveal_talent(talent_id)` → deducts credits, unlocks PII, logs audit
- `save_to_shortlist(talent_id, note?)`
- `get_credit_balance()` / `get_ledger(days?)`
- `start_topup(amount)` → returns Stripe checkout URL
- `update_company_profile(field, value)` → handles website, industry, hours, address, logo, linkedin
- `invite_teammate(email, role)`
- `list_teammates()`

Each tool runs through the agent runtime and writes to the same DB tables — no parallel UI surface.

### Company Profile via Chat

When Ops Omar is opened and the company has missing fields, he proactively asks: *"I noticed your operating hours and LinkedIn aren't set. Want to add them now?"* User answers in plain text → Omar calls `update_company_profile` → canvas shows the live profile card updating field-by-field. Same flow for hours, holidays, locations, "about us", banner image.

### Phase 1 — Unblock & Verify (do first)

1. Re-deploy `signup-company`.
2. Make the function return `{ error, code, details }` and the client toast show the real reason.
3. Smoke-test the full signup → land in `/company` → Riya greets you with 250 credits.

### Phase 2 — Three New Agents + Tool Layer

1. Seed `talent_scout`, `billing_bilal`, `ops_omar` rows in `ai_agents` (audience=`company`).
2. Build the tool registry: each tool is a typed function the agent runtime can dispatch. Tools live in a single edge function `company-agent-tools` so all five agents share one secure surface (with per-tool RBAC: only Bilal can call `start_topup`, only Riya/Maya can spend credits on talent, etc.).
3. Wire `useAgentRuntime` to recognise tool-call results that carry `canvas: { type, payload }` and open the right canvas component.

### Phase 3 — Canvas Components

Five small canvas components, all read/write through tools (no direct supabase from the canvas):

- `<JobDraftCanvas/>` — live editable job preview, "Publish" button calls `publish_job`
- `<TalentCardCanvas/>` — redacted card with "Reveal contact (5 credits)" CTA
- `<LedgerCanvas/>` — last 90 days, grouped by service, "Top up" CTA
- `<ProfileCanvas/>` — company profile editor with hours, address, logo upload
- `<TeamCanvas/>` — invite list + role chips

### Phase 4 — Multi-Workspace + Invites

- Workspace switcher in agent-list header (only shown if user has 2+ memberships).
- `invite_teammate` tool inserts a `company_members` row with `status='invited'` + `invited_email`.
- DB trigger `link_user_to_company_invites` on `auth.users` AFTER INSERT auto-claims invites by matching email → flips to `status='active'`, stamps `user_id`.

### Phase 5 — Progressive Enrichment

When any teammate opens the workspace, if the shared `companies` row is missing fields, Ops Omar drops one proactive message asking to fill them. Updates flow back to the shared row, so all 6,076 seeded companies progressively self-enrich as their reps onboard.

---

## Technical Notes

- **No new heavy tables.** Reuse `jobs`, `talents`, `companies`, `company_members`, `company_credit_ledger`, `ai_agents`. Add only:
  - `company_talent_shortlists (id, company_id, talent_id, added_by, note, created_at)`
  - `company_talent_reveals (company_id, talent_id, revealed_by, credits_spent, revealed_at)` — audit
  - `companies` columns: `operating_hours jsonb`, `about text`, `banner_url text`, `linkedin_url` (already exists)
- **One edge function for tools**: `company-agent-tools` validates JWT, resolves caller's `company_id` via `company_members`, dispatches to the requested tool, enforces per-tool RBAC.
- **Canvas dispatch pattern**: tool result `{ canvas: { type: 'job_draft', payload: {...} } }` is intercepted in the runtime hook and pushed into a `canvasState` Zustand store. The right pane subscribes and renders the matching component. Closing the canvas just clears the store.
- **Credit deduction** stays in the existing fractional model (numeric(12,1), per-response and per-action).
- **No `verify_jwt = false`** for `company-agent-tools` — it must auth-verify the caller and cross-check `company_members`.
- **RLS** on the two new tables follows the established pattern: `company_id IN (select company_id from company_members where user_id = auth.uid() and status='active')`.

---

## What's Out of Scope

- Approval queue (already removed, staying self-serve).
- Custom-built company agents (later — let companies clone & tune Riya).
- Direct human-to-human B2C messaging (everything stays through agents).
- Analytics dashboard.
- Tabs, forms, separate pages — none of these are coming back.

After this ships, a company rep signs up → lands in WhatsApp-style inbox → talks to Riya to post a job, Maya to find talent, Bilal to top up, Omar to set their profile and hours. The whole B2B loop, fully conversational, with a canvas for anything that needs a visual artifact.
