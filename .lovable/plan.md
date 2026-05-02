# Stakeholder Restructure — Companies Reorder + AI Agents OS

## Part 1 — Reorder Sidebar Stakeholders

Move **Companies** to sit immediately after **Talent** so the stakeholder order reads: Overview → Talent → **Companies** → **AI Agents** (new) → Recruitment → Learning → ...

Both `Companies` and the new `AI Agents` group will use the same collapsible-group pattern as Talent.

```text
Sidebar order
├── Overview
├── Talent (group)
├── Companies (group) ← moved up (already exists)
├── AI Agents (group) ← NEW: replaces flat entries in "AI & Monetization"
├── Recruitment
├── Learning
├── Marketing & Outreach
├── Career Abroad
├── Content Ops
├── Monetization (renamed from "AI & Monetization", agent-related items removed)
├── Investor Relations
├── Stakeholders
└── Platform Config
```

The existing flat agent entries (`AI Agents`, `Agent Studio`, `Channel Triggers`, `Marketplace Review`, `Agent Sessions`, `Agent Insights`, `Agent Payouts`) move into the new **AI Agents** group and are replaced by the structure below. Non-agent items (Credits, Withdrawals, Leads, Mock Interviews, Salary, Portfolios, Gigs, Notifications) stay under **Monetization**.

---

## Part 2 — AI Agents Stakeholder Group ("Agent OS")

A unified operating system for every AI agent across the platform (B2C, B2B, platform tools, user-generated, marketplace). Mirrors the Talent / Companies architecture: a collapsible sidebar group with sub-tabs, each backed by a tab component and (where conversational) an `AdminAnalystShell` console wired to a dedicated edge function.

### Sub-tabs (in order)

```text
AI Agents (collapsible)
├── 1. Agent OS Overview              ?tab=agents-overview
├── 2. Channels & Triggers            ?tab=agents-channels
├── 3. Tools, Skills & Connectors     ?tab=agents-tools
├── 4. Agent Studio (Builder)         ?tab=agents-studio
├── 5. Gro10x B2C Agents              ?tab=agents-b2c
├── 6. Platform Tool-Agents           ?tab=agents-platform
├── 7. Company / B2B Agents           ?tab=agents-b2b
├── 8. User-Generated Agents          ?tab=agents-ugc
├── 9. Marketplace & Payouts          ?tab=agents-marketplace
├── 10. Agent Manager (Console)       ?tab=agents-manager
└── 11. Sessions & Insights           ?tab=agents-sessions
```

### Tab-by-tab scope

**1. Agent OS Overview** — KPI dashboard. Counts by type (B2C / Platform / B2B / UGC / Marketplace), active vs draft, total runs (24h/7d/30d), credits earned per agent, top 10 by revenue, error/abort rate, channel mix (in-app / email / web / WhatsApp later), connector health summary.

**2. Channels & Triggers** — CRUD over an `agent_channels` table. A channel is *where* an agent fires (in-app chat, profile sidebar, feed prompt, email reply, scheduled cron, webhook). Each agent can be assigned to one or more channels with a primary direction (talent-facing / company-facing / admin-facing).

**3. Tools, Skills & Connectors** — Registry of capabilities an agent can call. Three categories:
- **Internal tools** (auto-discovered): every existing edge function exposed as an invokable tool (job search, CV parse, credit deduction, send-email, gig-create, etc.).
- **Skills** (composed prompts + tool chains, reusable across agents).
- **External connectors** (extensible): seed catalogue of Lovable-supported connectors that fit our roadmap (Resend, Google Sheets, Gmail, HubSpot, Slack, Telegram, Twilio, Airtable, Linear, Notion, Google Drive, Google Calendar, Asana, AWS S3, ElevenLabs, Firecrawl, Perplexity, Gemini Enterprise) with a "Status: not connected / linked / scoped to" flag. Provides the future scalability layer requested.

**4. Agent Studio (Builder)** — Form-based agent authoring. Pick: name, slug, persona/system prompt, model (gemini-2.5-flash / pro / gpt-5-mini etc.), allowed tools (from #3), channels (from #2), audience (talent / company / both / admin / public), monetization (free / per-response credits / subscription), visibility (internal / marketplace).

**5. Gro10x B2C Agents** — Filtered list of platform-built agents serving talents/users (Career Consultant, CV Coach, Interview Coach, Salary Negotiator, IELTS Tutor, Skill Advisor, Study Abroad, Mental Wellness, AI General). Inline metrics + edit shortcut.

**6. Platform Tool-Agents** — Non-conversational AI tools that earn credits (job-matching engine, AI insights on job cards, salary analysis processor, CV parser, portfolio generator, AI captions, recommendation engine). Shows usage volume × credit price = revenue.

**7. Company / B2B Agents** — Gro10x B2B side (Atlas, Recruiter, Sourcer, Outreach Writer, Growth, Lead Hunter, CRM, Sales, Gig Finder, Briefing, Billing, Ops, Calendar — the existing `GRO10X_AGENTS` catalog). Each row: primary direction (toward talent / toward company), channel, run count, credits consumed.

**8. User-Generated Agents** — Future-facing: agents created by talents or company contacts via a self-serve builder (gem-style). Admin queue for review/approval, abuse flags, owner attribution. v1 ships read-only with the schema in place so creation can light up later.

**9. Marketplace & Payouts** — Public-facing agent marketplace listings (already partially exists), reviews, featured slots, creator payout ledger (carries existing `agent-payouts` functionality).

**10. Agent Manager (Console)** — Conversational `AdminAnalystShell` powered by a new `admin-agent-manager` edge function. Lets the admin chat: "How is Aisha doing this week?", "Which 3 agents lost the most credits to errors?", "Draft a new pricing for CV Coach". The manager can read the registry, sessions, and run aggregations.

**11. Sessions & Insights** — Replaces current "Agent Sessions" + "Agent Insights" tabs. Filterable session log (agent, user, channel, duration, credits, outcome) plus charts.

---

## Part 3 — Database (new tables)

```sql
-- Channels an agent can be wired to
create table agent_channels (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,           -- 'in_app_chat', 'feed_prompt', 'email_reply', 'cron', 'webhook'
  label text not null,
  direction text,                     -- 'talent' | 'company' | 'admin' | 'public'
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Tools / skills / connectors registry
create table agent_tools (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  kind text not null,                 -- 'internal_tool' | 'skill' | 'external_connector'
  category text,                      -- 'jobs','credits','email','crm','data','comms', etc.
  edge_function text,                 -- for internal_tool
  connector_id text,                  -- for external_connector (matches Lovable connector_id)
  status text default 'available',    -- 'available' | 'linked' | 'scoped' | 'unavailable'
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Many-to-many: which agent uses which tools / channels
create table agent_tool_bindings (
  agent_id uuid references ai_agents(id) on delete cascade,
  tool_id  uuid references agent_tools(id) on delete cascade,
  primary key (agent_id, tool_id)
);
create table agent_channel_bindings (
  agent_id   uuid references ai_agents(id) on delete cascade,
  channel_id uuid references agent_channels(id) on delete cascade,
  is_primary boolean default false,
  primary key (agent_id, channel_id)
);

-- Classification + ownership for the 5 type buckets
alter table ai_agents
  add column if not exists agent_type text default 'b2c',
  -- 'b2c' | 'platform_tool' | 'b2b' | 'ugc' | 'marketplace'
  add column if not exists owner_user_id uuid,        -- for ugc/marketplace
  add column if not exists audience text,             -- 'talent'|'company'|'both'|'admin'
  add column if not exists monetization jsonb default '{}'::jsonb,
  add column if not exists visibility text default 'internal'; -- 'internal'|'marketplace'

-- All RLS: admin/super_admin via has_role(); UGC owners can read/update their own.
```

Seed `agent_channels` with the 5 default channels and `agent_tools` with: every existing internal edge function (auto-listed) + the connector catalog above.

---

## Part 4 — Edge Functions

- `admin-agent-manager` — analyst chatbot for tab #10 (Lovable AI gateway, gemini-2.5-flash; reads registry + sessions; same JWT-verify + admin role check pattern used by `admin-aisha-analyst`).
- `admin-agent-tools-discover` — one-shot scanner that lists every `supabase/functions/*` and upserts them into `agent_tools` with `kind='internal_tool'` so the registry stays current.

No changes needed to existing agent runtime functions.

---

## Part 5 — UI components (new)

```
src/components/dashboard/agents/
  AgentsOverviewTab.tsx
  AgentChannelsTab.tsx
  AgentToolsTab.tsx          (3 sub-sections: Internal / Skills / Connectors)
  AgentStudioTab.tsx         (re-uses existing AgentStudio if present; wraps it)
  AgentsB2CTab.tsx
  AgentsPlatformTab.tsx
  AgentsB2BTab.tsx
  AgentsUGCTab.tsx
  AgentsMarketplaceTab.tsx   (wraps existing Marketplace Review + Payouts)
  AgentManagerConsoleTab.tsx (uses AdminAnalystShell)
  AgentSessionsTab.tsx       (wraps existing sessions+insights)
```

Update `AdminSidebar.tsx` (reorder + new group) and `Dashboard.tsx` (route the 11 new `tab=agents-*` values).

---

## Quick decisions (proceeding unless objected)

1. Keep existing `Marketplace Review`, `Agent Payouts`, `Agent Sessions`, `Agent Insights` components alive — wrap them inside the new tabs rather than rewrite.
2. v1 of UGC tab is read-only (schema + admin queue ready, creator-facing builder ships later).
3. External connector catalog seeded as "available, not linked" — actual `standard_connectors--connect` flows wired only when a specific agent needs them.
4. Agent Manager analyst starts logging from now (no historical backfill).
