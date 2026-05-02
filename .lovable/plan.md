
## Idea — yes, this is the right move

Right now we have 10 separate conversational agents scattered across 5 sidebar groups (Overview, Talent, Companies, Agents, Investors). Each opens in its own tab, with no history persistence — refresh the page and the conversation is gone. That's fine for "drop in, ask a question" but terrible for ongoing strategic work (FP&A narratives, outreach drafts, weekly investor updates).

Splitting the admin into two surfaces is the right architecture:
- **Dashboard** (current) — information-dense, tables, KPIs, CRUD. Stays as is.
- **Dashboard / Chat** (new) — WhatsApp-style messenger. One thread per agent. Persistent history. Long-running context.

This also sets us up for cross-agent handoffs later (FP&A agent → Relationship Exec to draft an investor email).

---

## What we'll build

### 1. New route: `/dashboard/chat`
WhatsApp-style two-pane layout (collapses to single pane on mobile):

```text
┌─────────────────┬──────────────────────────────────────┐
│ Agents          │ ← Aisha (Talent Analyst)             │
│ ─────────────── │ ──────────────────────────────────── │
│ ● Business      │                                      │
│   Analyst   2m  │   [assistant bubble]                 │
│ ● Aisha     1h  │              [user bubble]           │
│   Riya          │   [assistant bubble]                 │
│   FP&A      3d  │                                      │
│   Rel. Exec     │                                      │
│   Agent Mgr     │ ──────────────────────────────────── │
│   Talent Out.   │ [ Type a message…              ↑ ]   │
│   Co. Out.      │                                      │
│   AI General    │                                      │
│   Co. AI Gen.   │                                      │
└─────────────────┴──────────────────────────────────────┘
```

Left rail = agent list with avatar, name, last-message preview, timestamp, unread dot.
Right pane = active thread, scrollable, markdown rendered, suggestions shown when empty.

### 2. The 10 agents migrated in
| Agent | Edge function | Source group |
|---|---|---|
| Business Analyst | `admin-analyst` | Overview |
| Aisha (Talent Analyst) | `ai-talent-analyst` | Talent |
| AI General (Talent) | `ai-general-analyst` | Talent |
| Talent Outreach Exec | `admin-talent-outreach` | Talent |
| Riya (Company Analyst) | `admin-riya-analyst` | Companies |
| Company AI General | `admin-company-ai-general-analyst` | Companies |
| Company Outreach Exec | `admin-company-outreach` | Companies |
| Agent Manager | `admin-agent-manager` | AI Agents |
| FP&A Agent | `admin-ir-fpa-analyst` | Investors |
| Relationship Exec | `admin-ir-relationship-exec` | Investors |

Each gets a profile card (avatar initial, name, role tagline, suggestions).

### 3. Persistent conversations
New tables (one thread per admin × agent):

```sql
create table admin_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,             -- admin user
  agent_key text not null,           -- 'admin-analyst', 'admin-riya-analyst', ...
  title text,                        -- auto-derived from first user msg
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, agent_key)        -- one thread per agent per admin
);

create table admin_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references admin_chat_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);
```

RLS: only the owning admin (and `has_role(admin)`) can read/write their own threads. `search_path=public` on any helper functions.

### 4. Edge functions — small adjustment
Each agent function already accepts `{ messages: [...] }`. We add an optional `thread_id` param. The server:
1. Loads the full message history from `admin_chat_messages` for that thread (authoritative source).
2. Appends the new user message, runs the AI, persists the assistant response.
3. Returns `{ content, thread_id }`.

Client never has to manage history — it just sends `thread_id + new user message`.

### 5. Sidebar
- Add a new top-level entry **Chat** (MessageCircle icon) that links to `/dashboard/chat`. Placed right under "Overview".
- Keep existing console tabs in their groups for now — but they will redirect to `/dashboard/chat?agent=<key>` so deep links from old habits still work. After one release we remove them.

---

## Files

**New**
- `src/pages/DashboardChat.tsx` — route shell
- `src/components/dashboard/chat/AgentRail.tsx` — left list
- `src/components/dashboard/chat/ChatThread.tsx` — right pane (re-uses markdown rendering from `AdminAnalystShell`)
- `src/components/dashboard/chat/AgentComposer.tsx` — input
- `src/lib/adminAgents.ts` — registry: key, name, tagline, icon, function name, suggestions (single source of truth, replaces hard-coded shells)
- `src/hooks/useAdminChatThread.ts` — load thread, send message, realtime subscribe
- `supabase/migrations/<ts>_admin_chat_threads.sql` — tables + RLS + realtime publication
- Edge function patch: each of the 10 functions reads `thread_id`, persists messages.

**Modified**
- `src/pages/Dashboard.tsx` — add `/dashboard/chat` route
- `src/components/dashboard/AdminSidebar.tsx` — add Chat entry
- The 10 existing `*ConsoleTab.tsx` files become thin redirect stubs (or are removed in a follow-up)

---

## Decisions before I build

1. **Persistence scope** — Plan above assumes **one persistent thread per agent per admin** (WhatsApp-style: you have one chat with each contact). Alternative is multi-thread per agent (like ChatGPT history sidebar). I recommend single-thread for v1 — much simpler and matches your "WhatsApp" framing. OK?

2. **Cross-agent handoff** — Out of scope for this build, but the schema supports it (we can add a `handoff_to` field later). Confirm we're not building it now.

3. **Old console tabs** — Redirect (soft deprecation) or remove immediately? I recommend redirect for one cycle.

If yes on all three I'll build it as specified.
