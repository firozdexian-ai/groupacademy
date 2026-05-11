## Workforce Command Center — Build Plan

A new admin page presenting the AI Workforce as an enterprise NOC: fleet of agents (templates + hired instances), channel connections, and a routing switchboard.

### Route & access
- New page: `src/pages/dashboard/WorkforceCommandCenter.tsx`
- Wired into `src/pages/Dashboard.tsx` as a lazy tab `agents-command-center` (matches existing `agents-multichannel` registration pattern).
- Sidebar: add "Command Center" entry under the **AI Agents** group in `src/components/dashboard/AdminSidebar.tsx` (icon: `Radar` or `Cpu`).
- Guarded with `useAdminScope()` — only `super` and `internal` scopes render content; others see an "Unauthorized" empty state.

### Visual language (NOC feel)
- Dark surface cards on `bg-card/30` with `backdrop-blur`, `border-border/40`.
- Top "status strip" row of 4 KPI tiles: Templates count, Hired Instances, Active Channels, Active Routes (one query each, colored dots for live state).
- Monospaced micro-labels (`text-[10px] uppercase tracking-widest text-muted-foreground/60`) reusing tokens already in `table.tsx` / `tabs.tsx`.
- All colors via semantic tokens — no raw hex.

### Tab 1 — The Fleet
Source: `ai_agents`.

- Segmented control at top: **Master Templates** (`is_template = true`) | **Hired Instances** (`is_template = false`).
- Search box (filters by `name` / `agent_key`).
- Table columns:
  - Agent Name (with `avatar_url` thumb + `agent_key` subtitle)
  - Key (`agent_key`)
  - Company (`company_id` → resolved name from `companies`; null → "Group Academy" badge)
  - Status (`is_active` / `kill_switch` indicator dot)
  - For instances: also show "Cloned from" (parent template name)
- Primary action button: **Hire / Clone Agent**
  - Dialog: select Master Template (dropdown of `is_template=true` agents) + Target Company (searchable list from `companies` ordered by name).
  - On submit: read full template row, insert duplicate with `is_template=false`, `parent_template_id=<template.id>`, `company_id=<selected>`, `agent_key = '<template.agent_key>__<companySlug>'` (uniqueness safety), preserve required NOT NULL fields.
  - Success toast + invalidate fleet query.

### Tab 2 — Channel Connections (The Phones)
Source: `workforce_channel_connections`.

- Table grouped by agent: Agent · Channel Provider · Credential summary (masked) · Active · Updated.
- Add / Edit dialog:
  - Agent dropdown (instances only — `is_template=false`).
  - Channel Provider select: `telegram`, `whatsapp`, `linkedin`, `web_widget`, `email`, `instagram`.
  - Credentials: JSON textarea with live `JSON.parse` validation; placeholder example per provider.
  - Active switch.
- Mutations: `upsert` on `(agent_key, channel_provider)`; delete with confirm.
- Credentials never shown raw in list — masked summary like `{token: ••••1234, …}`; reveal button inside edit dialog only.

### Tab 3 — Routing Switchboard (God Mode)
Source: `workforce_routing_rules`.

- Filters: Agent (incl. "Any/Global"), Channel Provider, Active only.
- Table columns: Agent (or "ANY" chip) · Event Topic · → · Channel · Destination ID · Active · Description.
- Add / Edit dialog:
  - Agent dropdown including **Any / Global** (stored as `NULL`).
  - Event Topic: select with presets `*`, `onboarding`, `transactions`, `alerts`, `signup`, `payment`, `error`, plus `Custom…` → free text input.
  - Destination Channel: same provider enum as Tab 2.
  - Destination ID: text (Chat ID / phone / email / webhook handle).
  - Description (optional), Active switch.
- Conflict hint: warn if a rule with same `(agent_key, event_topic, channel_provider, destination_id)` already exists.

### Data layer
- `@tanstack/react-query` for all fetching; mutations call `qc.invalidateQueries`.
- All Supabase calls via `@/integrations/supabase/client` and `.from("table" as any)` (tables not yet in generated types).
- `sonner` `toast` for success/error feedback; explicit error message from `error.message`.

### Files touched
- **Create** `src/pages/dashboard/WorkforceCommandCenter.tsx` (page + 3 tab panels co-located, ~600 LOC; split into helper components if it grows).
- **Edit** `src/pages/Dashboard.tsx` — register lazy `agents-command-center` tab.
- **Edit** `src/components/dashboard/AdminSidebar.tsx` — add "Command Center" link under AI Agents group.

### Out of scope
- Backend dispatcher that consumes routing rules to actually send messages on each channel.
- Per-channel credential schema validation beyond JSON syntax.
- RLS changes (assumed already restricting writes to admins on the new tables).
