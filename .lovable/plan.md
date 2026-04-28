# Agent OS — Consolidated, Tool-Using, Multi-Stakeholder Architecture

## Vision
Move from "26 chatbot wrappers" to a single **Agent Runtime** where every AI is a first-class stakeholder: it owns a skillset, calls tools, produces deliverables on a canvas, talks across talent / company / admin contexts, sends push outreach, and earns/spends credits against a target. Talents, companies, admins, and agents all interact through the same protocol.

## Locked Decisions (from user)
1. **Connection fee** — default **1.25 credits** (= 125 BDT). `ai-general` and `aisha` are free.
2. **Talent-built agent build fee** — 3 levels mirroring profession grading:
   - L1 = 10 credits (basic prompt, no tools)
   - L2 = 25 credits (1–2 tools)
   - L3 = 50 credits (full tools allowlist + outreach)
   The connection fee a talent-built agent can charge is also capped by its level.
3. **Canvas behavior** — **chat-first**; canvas auto-expands the first time an artifact is produced in a thread, then is collapsible. On mobile it becomes a bottom sheet.
4. **B2B billing** — companies live in the same credit wallet system. New `company_credits` table mirroring `talent_credits` (same `numeric(12,1)`, withdrawable/free split, same transaction types).

## Current State (audit)
- `ai_agents` has 26 rows, all flat at 1 credit; routed through one edge function `ai-agent-chat` (Gemini stream, no tools).
- Parallel one-off endpoints (`ai-instructor-chat`, `ai-support-assistant`, `ai-auth-agent`, `analyze-*`, `generate-*`, `score-*`, `parse-*`) duplicate plumbing.
- Sessions in `agent_chat_sessions` (single talent participant, blob `messages jsonb`, no artifacts).
- `company_agents` / `company_agent_leads` exist but unused as a real B2B surface.
- Talent UI: `AIAgents.tsx`, `AgentChatDialog`. Admin: `AIAgentsManager`, `CompanyAgentsManager`. No shared canvas, no cross-stakeholder threads, no agent-initiated push.

## Target Architecture

### 1. Unified Agent Runtime (one edge function)
`agent-runtime` becomes the only AI execution endpoint. Every existing analyze/generate/score/chat function is reframed as either a **skill** the runtime invokes, or a thin wrapper that calls the runtime with a fixed agent + tool.

Loop:
1. Load agent config (prompt, allowed tools, pricing tier, audience).
2. Verify caller (talent | company_user | admin | agent-to-agent).
3. Check `agent_connections` (one-time fee paid?) + wallet balance.
4. Stream Gemini with `tools: [...]` from the agent's `tool_keys`.
5. On tool call → execute skill → push artifact to canvas → continue stream.
6. On final delivery → charge `delivery_credit_cost` + log impact.

### 2. Schema

**Extend `ai_agents`:**
- `audience text[]` — `talent`, `company`, `admin`
- `connection_fee numeric(12,1) default 1.25`
- `tool_keys text[]`
- `monthly_credit_target integer`
- `agent_owner_id uuid` (talent-built)
- `agent_level int` — 1/2/3 (sets caps on tools + connection fee)
- `visibility text` — `public`, `private`, `marketplace`
- `tier text` — `standard`, `premium`, `enterprise`
- `message_credit_cost numeric(12,1) default 1.0`

**New tables:**
- `agent_tools` — `tool_key`, `name`, `input_schema jsonb`, `handler_endpoint`, `credit_cost numeric(12,1)`, `output_kind` (`text|image|file|plan|search_result`), `min_agent_level int`.
- `agent_connections` — `(subject_kind, subject_id, agent_id, connected_at, fee_paid numeric(12,1))`. `subject_kind` ∈ `talent|company|admin`. Unique.
- `agent_threads` (replaces `agent_chat_sessions`) — `participants jsonb`, `context_kind` (`talent_chat|company_chat|admin_briefing|agent_to_agent`), `linked_entity_kind`, `linked_entity_id`, `is_active`, `credits_charged numeric(12,1)`.
- `agent_messages` — `thread_id`, `role`, `content`, `tool_calls jsonb`, `artifact_id`, `credits_charged numeric(12,1)`. Replaces blob storage.
- `agent_artifacts` — `thread_id`, `kind` (`image|document|plan|search_results|graphic|thumbnail`), `payload jsonb`, `storage_path`, `approval_state` (`draft|pending|approved|rejected`), `requires_approval bool`, `delivery_charged bool`.
- `agent_outreach` — `agent_id`, `recipient_kind`, `recipient_id`, `channel` (`push|in_app|email`), `template`, `sent_at`, `opened_at`, `converted_at`, `credits_attributed numeric(12,1)`.
- `agent_credit_events` — granular ledger: `agent_id`, `actor_kind`, `actor_id`, `event_kind` (`connection_fee|message|tool_invocation|delivery|outreach_conversion|build_fee|marketplace_revenue`), `amount numeric(12,1)`, `impact_score`.
- `company_credits` — mirrors `talent_credits` (`company_id`, `balance numeric(12,1)`, `earned_balance numeric(12,1)`).
- `company_credit_transactions` — mirrors `credit_transactions`.

RLS: same pattern as existing tables — owner via `auth.uid()`, admin via `has_any_admin_role`. Companies via `company_members(user_id, company_id, role)` already in place.

### 3. Pricing Model (replaces flat 1 credit)

Per agent, in `ai_agents`:
```text
connection_fee         one-time, on first thread (default 1.25; free for ai-general, aisha)
message_credit_cost    per assistant reply (default 1.0; premium 2-5)
tool_credit_costs      per skill call from agent_tools.credit_cost (image-gen 5, deep-research 15)
delivery_credit_cost   on final artifact approval (image 10, plan 25, thumbnail 8)
```

Talent-built agent caps by level:
| Level | Build fee | Max connection fee | Max tools | Outreach allowed |
|---|---|---|---|---|
| L1 | 10 | 1.25 | 0 | no |
| L2 | 25 | 5 | 2 | no |
| L3 | 50 | 15 | unlimited | yes |

Final charge per turn = `message + Σ(tools used) + (delivery if artifact finalized)`.
Live "running cost" indicator above the composer; B2B canvas requires explicit approve button before delivery charge fires.

### 4. Stakeholder Dimensions

| Surface | Audience | Examples |
|---|---|---|
| Talent app | talent | Job Hunter (uses `search_jobs`), CV Coach (`parse_cv` + `rewrite`), AI General concierge |
| Company portal | company | QA Assistant, Talent Sourcer, Outreach Writer, Graphics Designer |
| Admin panel | admin | Aisha-Admin (registration briefings), Ops Sentinel (anomaly alerts), Revenue Coach |
| Agent-to-agent | mixed | Aisha (talent auth → admin briefing), Job Hunter (talent ↔ employer leads) |

Aisha example: on new signup, Aisha writes an `agent_outreach` row to admins (in-app + push) with the registration summary. Same agent identity, two audiences via `audience text[]`.

### 5. Canvas (deliverables UI)

`AgentCanvas` panel renders `agent_artifacts` for the active thread.
- **Default state**: collapsed, chat takes full width.
- **Auto-expand**: first artifact in a thread expands canvas (desktop: right side panel ~40%; mobile: bottom sheet).
- **Collapse / re-expand** via toggle in chat header. State persisted per thread.
- Renderers per `kind`:
  - `image / thumbnail` — preview, regenerate, approve
  - `plan / proposal` — stepper, B2B approval button (charges `delivery_credit_cost` only on approve)
  - `search_results` — Job Hunter ranked list with save / apply / discard
  - `document` — markdown editor + export

Approval state drives delivery charge — solves the "image cost vs final result cost" question.

### 6. Tool Library (initial set, mostly wraps existing functions)

| tool_key | wraps | output_kind | credit_cost | min_level |
|---|---|---|---|---|
| `search_jobs` | new SQL + `suggest-jobs-for-talent` | search_result | 2 | L2 |
| `score_job_match` | `score-job-match` | text | 1 | L1 |
| `parse_cv` | `parse-cv` | document | 1 | L1 |
| `enhance_cover_letter` | `enhance-cover-letter` | document | 2 | L2 |
| `generate_image` | Lovable AI gemini-image | image | 5 | L2 |
| `deep_research` | Firecrawl + summarizer | document | 15 | L3 |
| `prepare_application` | `prepare-external-application` | plan | 5 | L2 |
| `send_outreach` | `generate-outreach-message` + mailto | document | 3 | L2 |
| `analyze_salary` | `analyze-salary` | plan | 5 | L2 |
| `notify_user` | new — writes `notifications` + push | side-effect | 0.5 | L3 |

Adding a new tool (legal, YouTube thumbnails, etc.) = one row in `agent_tools`.

### 7. Agent-Initiated Outreach & Targets
- Each agent has `monthly_credit_target` (column already exists).
- Cron `agent-outreach-scheduler` (hourly) picks agents below target, finds eligible recipients (Job Hunter → talents with new matching jobs; AI Instructor → enrolled students with upcoming class; Aisha → admins with pending registrations).
- Sends via Web Push + in-app notification + optional email (uses native `enqueue_email`).
- Recipient opening the thread credits `outreach_conversion` to that agent's `agent_credit_events` for performance dashboards.

### 8. Talent-Built Agents (marketplace)
- Talent picks level (L1/L2/L3) → pays build fee from wallet → row inserted with `agent_owner_id = talent_id`, `visibility='private'`, `agent_level` set, `tool_keys` filtered by level cap.
- Owner submits for review → admin promotes to `marketplace`.
- Other talents pay the agent's `connection_fee` to chat; revenue split tracked in `agent_credit_events` (`marketplace_revenue`). Default split: 70% owner / 30% platform (configurable in `platform_settings`).
- Same runtime, same canvas — no new code path.

### 9. B2B Wallet
- `company_credits` + `company_credit_transactions` mirror talent tables.
- Admins can grant credits from admin panel; companies top up via existing WhatsApp invoice flow (extend `credit_invoices` with `subject_kind`).
- Every B2B agent action (chat, tool, delivery) deducts from `company_credits`.
- Company portal shows wallet, target progress per agent, ROI per agent.

### 10. Migration Path (incremental)

```text
Phase 1  Schema (all new tables + ai_agents extensions); seed agent_tools registry
Phase 2  agent-runtime edge function; ai-agent-chat becomes a thin shim → runtime
Phase 3  3 reference tools wired (search_jobs, generate_image, parse_cv) + AgentCanvas (chat-first, auto-expand)
Phase 4  Connection fee + tiered pricing + running-cost UI in AgentChatDialog
Phase 5  company_credits + company portal agent surface (QA Assistant first)
Phase 6  Admin Aisha-briefing + agent_to_agent threads
Phase 7  Outreach scheduler + per-agent target dashboard
Phase 8  Talent-built agent marketplace (L1/L2/L3 builder + revenue split)
```

Phases 1–4 deliver visible talent value; 5–6 unlock B2B revenue; 7–8 are the flywheel.

## Out of Scope (v1)
- Voice agents (Whisper blocked by platform constraint).
- Realtime multi-user co-editing on canvas.
- Auto-tuning of `monthly_credit_target` via ML.

## Deliverables for Phase 1 (next message scope)
1. Migration: extend `ai_agents`, create `agent_tools`, `agent_connections`, `agent_threads`, `agent_messages`, `agent_artifacts`, `agent_outreach`, `agent_credit_events`, `company_credits`, `company_credit_transactions`. RLS for all.
2. Seed `agent_tools` with the 10 tools above.
3. Backfill existing `agent_chat_sessions` rows into `agent_threads` + `agent_messages` (no data loss).
4. Update `ai_agents` defaults: `connection_fee=1.25` for all except `ai-general` and `aisha-*` (=0); set `audience` per agent.
5. New RPCs: `connect_to_agent(agent_id)`, `start_agent_thread(agent_id, context_kind, linked_entity)`, `charge_agent_turn(thread_id, message_cost, tool_costs jsonb)`, `approve_artifact(artifact_id)` (handles delivery charge), `purchase_built_agent(level, config jsonb)`.
