# Agent OS — Final Consolidated Plan (v3)

The end-state: every meaningful interaction on the platform — for talents, companies, and admins — happens through conversation with an agent. The company portal looks and feels like **WhatsApp Business, but every contact is an AI employee**. The talent app already moves that direction; admin becomes an "ops control room" of agent threads. No more form-heavy CRUD screens for the things humans naturally describe in words.

---

## Locked decisions (carried from v1/v2)

- Connection fee default **1.25 credits** (free for `ai-general`, `aisha`).
- Talent/company-built agents: **L1=10, L2=25, L3=50** build credits; level caps tools + connection fee.
- Canvas: **chat-first**, auto-expands on first artifact, collapsible.
- Companies live on the **same credit wallet model** (`company_credits`).
- Embeddings: `google/text-embedding-004` (free in gateway).
- Plain-language agent builder uses `gemini-2.5-pro`; runtime uses `gemini-3-flash-preview`.
- A/B prompts start at fixed 50/50, custom % later.
- Headless agents bill the **platform pool** (admin-toppable, capped monthly).

---

## 1. The three surfaces, all agentic

### A. Talent app (already partially there)
- Primary surface stays the **Agent Hub** (`/app/agents`) + concierge search bar.
- Career assessment, salary analysis, mock interview, portfolio request, job application — all wrapped as agent skills, not standalone forms. Forms remain as a **fallback** behind the agent ("prefer to fill a form?" link).
- Quick Actions grid stays — it's just a launcher into agent threads.

### B. Company portal (new — the WhatsApp Business clone)
- After a company signs up, they land on `/company/inbox`. Layout = WhatsApp web:
  - **Left**: thread list of "AI Employees" (Recruiter, Talent Sourcer, Outreach Writer, Brand Designer, QA Coach, Analyst, Compliance, Wallet, Builder).
  - **Right**: open thread, chat-first, canvas auto-expands when an artifact appears (job draft, shortlist, banner, contract).
- **Every B2B action is a conversation**:
  - Post a job → talk to **Recruiter** ("hire a senior backend engineer in Singapore, remote OK, $4-6k"). It drafts the JD on canvas → company approves → published.
  - Find candidates → talk to **Talent Sourcer**. Returns ranked talents on canvas with one-click shortlist.
  - Send outreach → **Outreach Writer** generates `mailto:` drafts (existing memory rule).
  - Visual content → **Brand Designer** uses `generate_image`.
  - Wallet & invoices → **Wallet** agent ("top up 5000 credits"). Triggers existing WhatsApp invoice flow.
  - Build their own agent → **Builder** asks 4 questions, then runs the no-code Agent Builder in the background.
- Push notifications + in-app badges drive companies back into threads (agents proactively pinging when there's new applicants, low credit, or a candidate replied).
- **No traditional CRUD screens**. Settings, billing, team — all reachable via thread + a thin settings drawer for edge cases.

### C. Admin panel (becomes Agent Ops Control Room)
- Top-level new section **Agents OS** with:
  - **Builder** (per-agent 6-tab editor — see §3).
  - **Inbox** — admin's own WhatsApp-style inbox where headless agents file briefings (Aisha → new signups, Assessment Reporter → new results, Course Celebrant → completions, Revenue Coach → margin alerts).
  - **Insights** — per-agent dashboards (tokens, margin, earnings, A/B results).
  - **Marketplace Review** — approve talent/company-built agents.
  - **Wallet pools** — top up the platform headless pool, set monthly cap, view burn.
- The existing form-heavy admin sections (jobs, companies, talents) **stay** for now but each gets a **"Talk to ops agent about this"** button on every detail page that opens a thread with the relevant admin agent pre-loaded with the entity's context.

---

## 2. Unified Agent Runtime (single edge function)

`agent-runtime` replaces all one-off AI endpoints over time. Loop:

1. Auth caller → resolve `subject_kind` (talent | company_user | admin | system).
2. Load agent (prompt + tools + KB + pricing + level + kill-switch + active prompt variant).
3. Check `agent_connections` (one-time fee) + wallet balance + headless pool if applicable.
4. Retrieve KB chunks via vector search → inject as system context.
5. Stream Gemini with `tools: [...]` from agent's allowed tool keys.
6. On each tool call → invoke handler endpoint (which is just an existing edge function: `score-job-match`, `parse-cv`, `generate-image`, `prepare-external-application`, `analyze-salary`, `suggest-jobs-for-talent`, `enhance-cover-letter`, `generate-outreach-message`, etc.) → push artifact to canvas.
7. On final delivery → charge per `pricing` table; log tokens in/out and llm_cost_usd into `agent_credit_events`.

Existing `ai-agent-chat` becomes a thin shim → runtime. New skill = one row in `agent_tools`. **Zero rewrites of the existing analyze/generate/score functions.**

---

## 3. No-code Agent Builder (admin + company + talent, same UI)

Single component `<AgentBuilder/>` mounted at `/admin/agents/:id`, `/company/agents/:id`, `/app/builder/:id`. RLS scopes editing rights via `owner_kind` / `owner_id`.

| Tab | Configures | Key element |
|---|---|---|
| **Identity** | Name, key, avatar (image generated on the fly), audience (`talent` / `company` / `admin` / `headless`), visibility, tier, kill-switch | Inline image gen |
| **Brain** | Plain-language brief → AI proposes prompt + tools + KB outline + pricing tier (`agent-blueprint-from-brief` edge fn). Or write the prompt directly. A/B variants live here. | Diff preview before Apply |
| **Knowledge** | Drag-drop PDFs/DOCX/MD/URLs/raw text → `ingest-agent-knowledge` chunks + embeds | Re-ingest on update; per-source toggle |
| **Skills** | Multi-select from `agent_tools`; per-tool credit override | Filtered by `agent_level` cap |
| **Pricing** | Connection fee, message cost, delivery cost, monthly target | Live "typical turn cost" preview |
| **Triggers & Outreach** | Subscribe to `platform_events` (signup, course_completed, assessment_done, job_applied, low_balance, new_application_received, etc.); recipient routing; template; cron schedule | Test-fire with sample payload |

This is what fulfils "no more code changes for new agents". Adding a "LinkedIn Pulse Writer" agent for companies = open Builder, write brief, pick Skills, save. Done.

---

## 4. Everything-is-an-agent (headless layer)

`platform_events` table + DB triggers on `enrollments`, `job_applications`, `assessment_leads`, `talents`, `credit_transactions`, `gigs`, `feed_posts`, `company_jobs`. Every event becomes an addressable hook.

Cron `agent-event-dispatcher` (every 1 min) reads new events, finds matching `agent_triggers`, runs agent against payload, writes:
- `agent_outreach` row,
- `notifications` row (in-app),
- web-push,
- a thread in the recipient's agentic inbox so the agent's reasoning is visible (not a black-box notification).

Mapped headless agents ready at launch:
- `aisha-briefer` — new signup → admin.
- `assessment-reporter` — assessment done → admin + congratulatory DM to talent.
- `cohort-celebrant` — course completed → certificate notification + next-course suggestion.
- `job-followup` — application sent → 7-day follow-up nudge to talent.
- `wallet-coach` — credits below threshold → top-up CTA.
- `recruiter-pinger` — new application received on a company job → ping company recruiter thread.
- `re-engager` — idle high-value talent → personalised come-back outreach.

Same runtime, same canvas, same billing — they just have no chat surface; they push.

---

## 5. Schema (all additions in one place)

```text
ai_agents +=
  audience text[]                  -- 'talent','company','admin','headless'
  owner_kind text, owner_id uuid   -- platform | talent | company
  visibility text                  -- 'public','private','marketplace'
  tier text                        -- 'standard','premium','enterprise'
  agent_level int                  -- 1/2/3 for talent/company-built
  connection_fee numeric(12,1) default 1.25
  message_credit_cost numeric(12,1) default 1.0
  delivery_credit_cost numeric(12,1) default 0
  monthly_credit_target int
  behavior_brief text              -- plain-language source
  kill_switch bool default false
  avatar_url text                  -- already partly used
  active_prompt_version_id uuid

agent_prompt_versions    (id, agent_id, prompt, label, traffic_pct, created_by, created_at)
agent_tools              (tool_key PK, name, description, input_schema jsonb, handler_endpoint, credit_cost numeric(12,1), output_kind, min_agent_level int)
agent_tool_overrides     (agent_id, tool_key, enabled bool, credit_cost numeric(12,1))
agent_connections        (subject_kind, subject_id, agent_id, fee_paid numeric(12,1), connected_at)  -- unique
agent_threads            (id, agent_id, participants jsonb, context_kind, linked_entity_kind, linked_entity_id, is_active, credits_charged numeric(12,1), created_at)
agent_messages           (id, thread_id, role, content, tool_calls jsonb, artifact_id, credits_charged numeric(12,1), created_at)
agent_artifacts          (id, thread_id, kind, payload jsonb, storage_path, approval_state, requires_approval bool, delivery_charged bool)
agent_outreach           (id, agent_id, recipient_kind, recipient_id, channel, template, sent_at, opened_at, converted_at, credits_attributed numeric(12,1))
agent_credit_events      (id, agent_id, actor_kind, actor_id, event_kind, amount numeric(12,1), tokens_in int, tokens_out int, model text, llm_cost_usd numeric(12,4), impact_score, created_at)
agent_knowledge_sources  (id, agent_id, kind, storage_path, source_url, status, char_count)
agent_knowledge_chunks   (id, source_id, agent_id, chunk_idx, content text, embedding vector(768))
agent_triggers           (id, agent_id, event_kind, filter jsonb, recipient_route, template, is_active, last_fired_at)
platform_events          (id, event_kind, subject_kind, subject_id, payload jsonb, occurred_at, processed_at)

company_credits             (company_id, balance numeric(12,1), earned_balance numeric(12,1))
company_credit_transactions (mirror of credit_transactions)

platform_settings +=
  agent_marketplace_split numeric default 0.7    -- owner share
  headless_pool_monthly_cap numeric              -- platform pool cap
```

RLS: owner via `auth.uid()` against `owner_kind/owner_id`; admin via `has_any_admin_role`; companies via `company_members`. Vector index on `agent_knowledge_chunks.embedding`.

---

## 6. New edge functions

| Function | Purpose | verify_jwt |
|---|---|---|
| `agent-runtime` | Single execution loop (chat + tools + KB + billing + telemetry) | true |
| `agent-blueprint-from-brief` | Plain-language → suggested config | true |
| `ingest-agent-knowledge` | Chunk + embed KB sources | true |
| `agent-event-dispatcher` | Cron — process `platform_events` → fire triggers | false (cron) |
| `agent-outreach-scheduler` | Cron — push target-driven outreach | false (cron) |

All existing AI endpoints are kept and registered as **tool handlers**.

---

## 7. Pricing & wallets

- Per turn: `message_cost + Σ(tool_costs) + (delivery_cost if artifact approved)`.
- Connection fee charged once per `(subject, agent)` pair. Free for `ai-general`, `aisha`, all headless agents (they bill the platform pool, not the user).
- Talent-built marketplace: 70% owner / 30% platform on `connection_fee` + every paid turn.
- Companies top up via existing WhatsApp invoice flow (extend `credit_invoices.subject_kind`). Same approval RPC, mirrored for company wallet.
- "Running cost" indicator above the composer for all chat surfaces.
- Margin alarm: `agent-runtime` flags any agent where `llm_cost_usd > credits_charged * 0.5 BDT` for >24h → admin notification via `Revenue Coach` agent.

---

## 8. Scalable improvements piggybacked into this work

While restructuring, these high-leverage upgrades land "for free":
- **Talent app**: replace the 26 separate chatbot pages with a single `/app/agents/:agentKey` route powered by runtime; concierge search bar (already memory'd) becomes the entry to any agent.
- **Profile** stays the same; agents read it as context (`get_talent_profile` tool).
- **Admin form pages** all gain a "Talk to ops agent" button → dramatically reduces clicks to do common tasks (publish job, refund credits, suspend talent).
- **Notifications** unify under `agent_outreach` so we get one analytics surface for every push the platform sends.
- **Tool registry** doubles as a permissions catalog — easy to audit "what can each agent do?".
- **Kill-switch + A/B prompt variants** mean we can iterate on agent quality without redeploys.

---

## 9. Migration phases (sequenced for visible value early)

```text
P1  Schema (all tables) + seed agent_tools + ai_agents extensions + RLS
P2  agent-runtime edge fn + KB retrieval + ai-agent-chat shim → runtime
P3  Admin Agent Builder (Identity, Brain, Skills, Pricing) replaces AIAgentsManager
P4  Knowledge tab + ingest-agent-knowledge + agent-blueprint-from-brief
P5  Triggers tab + platform_events + agent-event-dispatcher;
    convert assessment / course-complete / signup / low-balance into headless agents;
    admin agentic inbox
P6  Per-agent insights dashboard (tokens, margin, earnings, A/B promote)
P7  Canvas (chat-first auto-expand) + delivery approval billing
P8  company_credits wallet + Company Agent Builder
P9  Company portal "WhatsApp Business" inbox with launch agents
    (Recruiter, Talent Sourcer, Outreach Writer, Brand Designer, Wallet, Builder)
P10 Talent-built marketplace (L1/L2/L3 + 70/30 split + admin review queue)
P11 Multi-channel agent surfaces (web push, email; later WhatsApp/Telegram via connectors)
```

P1–P5 = the invisible foundation + immediate admin upgrade.
P6–P7 = control tower + canvas magic.
P8–P9 = the company portal vision realised.
P10–P11 = ecosystem & growth.

---

## 10. Out of scope for v1

- Voice agents (platform constraint).
- Realtime co-editing on canvas.
- Auto-tuned prompts via RL (manual A/B promote only).
- External channel agents (WhatsApp/Telegram) — schema-ready, deferred until P11.

---

## Final locked decisions (v3)

- **Company portal layout**: pure WhatsApp-Business clone. Inbox left, thread right, profile menu top-right. No dashboard tabs.
- **Headless events at launch**: include `feed_posts.created` and `gig_submissions.created` (enables moderator agents later with zero rework).
- **Marketplace launch**: talent-built agents only for the first 4 weeks; open to companies after the moderation rhythm is proven.

Starting **Phase 1**: schema migration + tool registry seed + `ai_agents` extensions + RLS.
