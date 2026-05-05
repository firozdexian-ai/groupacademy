# Plan: Per-Agent Messaging Channels (WhatsApp via Unipile + Telegram)

Shift from one central inbox to a **channel-per-agent** model. Each admin AI agent (e.g. `talent-exec-bd`, `talent-exec-mena`, `companies-outreach`, `inst-outreach`) can independently own:

- 0..N **WhatsApp numbers** (linked via Unipile)
- 0..N **Telegram bots** (via the Lovable Telegram connector)

This lets us spin up region-specific talent executives (BD number, MENA number, etc.) and also expose any agent to non-platform users on Telegram.

---

## 1. Concept

```text
agent (admin_agents row)
  └── agent_channels (one per linked endpoint)
        ├── provider: whatsapp | telegram
        ├── unipile_account_id  (whatsapp)
        ├── telegram_bot_username (telegram)
        ├── persona_overrides (optional system-prompt tweaks)
        └── status, region, language
              └── agent_conversations
                    └── agent_messages (in/out, threaded by external chat id)
```

Inbound message → resolve `agent_channels.agent_id` → run that agent (reusing existing `agent-runtime`) → reply through the same channel.

---

## 2. Database (new tables, all RLS-gated to admin)

```text
agent_channels
  id, agent_key (fk admin_agents-style identifier),
  provider (whatsapp|telegram),
  label, region, language,
  -- whatsapp
  unipile_account_id, phone_e164,
  -- telegram
  telegram_bot_id, telegram_bot_username, telegram_secret_hash,
  status (pending|connected|disconnected|error),
  auto_reply_enabled bool default true,
  rate_limit_per_min int default 4,
  created_by, created_at

agent_conversations
  id, channel_id (fk), external_chat_id,
  peer_handle (phone for wa, @username/chat_id for tg),
  peer_display_name, last_message_at, unread_count,
  assigned_human_user_id nullable    -- when an operator takes over

agent_messages
  id, conversation_id, external_message_id,
  direction (in|out), author (user|agent|human_operator),
  body, attachments jsonb,
  status (queued|sent|delivered|read|failed),
  agent_run_id nullable,             -- link to agent-runtime invocation
  created_at

agent_outbound_queue
  id, channel_id, conversation_id nullable,
  to_handle, body, template_key,
  scheduled_for, status, error, sent_at

agent_message_templates
  id, agent_key, channel_provider, key, name, body, variables jsonb
```

Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages, agent_conversations;`

---

## 3. Edge functions

| Function | verify_jwt | Purpose |
|---|---|---|
| `channel-link-whatsapp` | true | Calls Unipile `POST /v2/auth/link` with `providers:"WHATSAPP"`, redirect back to `/dashboard/agents/{agentKey}/channels`. Creates pending `agent_channels` row. |
| `channel-link-telegram` | true | Accepts a bot token (or uses Lovable Telegram connector), registers webhook with derived `secret_token`, creates `agent_channels` row. |
| `channel-status` | true | Polls/refreshes provider state. |
| `channel-send` | true | `{channel_id, to_handle?, conversation_id?, text, attachments?}` → routes to `unipile-send` or `telegram-send`. Persists message. |
| `channel-batch-send` | service | Cron drain of `agent_outbound_queue` honoring `rate_limit_per_min` per channel. |
| `unipile-webhook` | false | HMAC-verified. On inbound message: upsert conversation + message, then if `auto_reply_enabled` invoke `agent-runtime` for `channel.agent_key` and post the agent's reply back via `channel-send`. |
| `telegram-webhook` | false | Same flow. Webhook secret derived per channel from `telegram_secret_hash` so multiple bots share one function. URL: `/functions/v1/telegram-webhook?channel=<id>`. |

`agent-runtime` gains a thin adapter: instead of returning chat tokens to the dashboard UI, it can also be invoked headless with `{agent_key, conversation_id, history[]}` and produce a single reply string + tool-call results.

---

## 4. Provider details

**WhatsApp (Unipile)** — direct REST, not a Lovable connector.
- Secrets: `UNIPILE_API_KEY`, `UNIPILE_DSN`, `UNIPILE_WEBHOOK_SECRET`.
- Phone → user-id: strip `+`/spaces, append `@s.whatsapp.net`.
- Endpoints: `POST /v2/auth/link`, `POST /v2/{account_id}/chats` (start), `POST /v2/{account_id}/chats/{chat_id}/messages/send`, `PATCH …/chats/{chat_id}` (read/mute), `GET …/chats`, `GET …/chats/{chat_id}/messages`.
- Throttle ≥ 10–20s between new conversations to avoid spam flag.
- Wait for `account.initial_sync.completed` before exposing history.

**Telegram** — use the existing **Telegram Lovable connector** (gateway path). Multiple bots = multiple connections under the same connector; each `agent_channel` stores which connection key to read (`TELEGRAM_API_KEY`, `TELEGRAM_API_KEY_2`, …). Webhook secret = `sha256("telegram-webhook:" + connection_key)` per-channel.

---

## 5. Admin UI

New route group: `/dashboard/agents/:agentKey/channels`

Tabs inside an agent's profile:

1. **Channels** — list all WhatsApp numbers + Telegram bots for this agent. "Link WhatsApp" / "Link Telegram bot" buttons. Toggle `auto_reply_enabled`, set `rate_limit_per_min`, region, language.
2. **Inbox** — 2-pane (chats list ↔ thread). Reuses `ChatBubble`. Shows `agent` vs `human_operator` bubbles distinctly. "Take over" button pauses auto-reply for that conversation.
3. **Templates** — CRUD `agent_message_templates`.
4. **Outbound queue** — view/pause/resume scheduled sends.

Plus a **global cross-agent inbox** at `/dashboard/inbox` aggregating all `agent_conversations` the operator has access to (filterable by agent / channel / region).

---

## 6. Migrate existing `wa.me` touchpoints

Components keep their `wa.me` deep-link as the **default** behavior. Where an operator is logged in and the relevant agent has at least one connected WhatsApp channel, expose a second action:

> "Send via {agent} ({+8801…})"

Affected files: `FloatingWhatsAppButton`, `ShareSheet`, `ContactsManager`, `LeadHunterManager`, `BatchCompanyUpload`, `CVOutreachGenerator`, `JobApplicationsManager`, IR templates, gig sharing forms.

Helper: `sendThroughChannel({agentKey, provider, to, body})` resolves the right `agent_channels` row (region/language match) and either calls `channel-send` or enqueues into `agent_outbound_queue`.

Talent-facing flows (the floating bonus button) **stay on `wa.me`** to protect connected numbers from being banned by mass community traffic.

---

## 7. Rollout

1. Schema + secrets + Unipile link flow for one agent (pilot: `talent-exec-bd`).
2. Inbound webhook → auto-reply via `agent-runtime` → outbound send. End-to-end loop for one BD number.
3. Telegram bot link flow + webhook (same agent).
4. Per-agent inbox UI + templates + take-over.
5. Outbound queue + cron throttle.
6. Wire bulk operator buttons (LeadHunter, CV outreach) through `sendThroughChannel`.
7. Add MENA / additional regional executives as separate `agent_channels`.

---

## 8. Open questions before I build

1. Do you already have a Unipile workspace + DSN, or should step 1 be onboarding instructions?
2. For Telegram, should we use the **Lovable Telegram connector** (one OAuth-style connection per bot, gateway-managed) or accept raw bot tokens stored as channel secrets (simpler, but you manage tokens)?
3. Should an inbound WhatsApp message from an unknown number on the BD executive's line auto-create a lightweight talent record (so the agent has CRM context) or stay as a pure conversation until the human assigns it?

---

## Technical notes (CTO)

- One `unipile-webhook` and one `telegram-webhook` function each route to many agent_channels by inspecting the payload (Unipile `account_id`, Telegram `?channel=` query + `secret_token`).
- HMAC: Unipile webhook signature header verified against `UNIPILE_WEBHOOK_SECRET`; Telegram via `X-Telegram-Bot-Api-Secret-Token` derived per-channel.
- All admin DB access gated by `has_role(auth.uid(),'admin')` + new `talent_success_executive` role for regional operators (read/write only their assigned `agent_channels`).
- `pg_cron` + `pg_net` invoke `channel-batch-send` every minute.
- Indexes: `agent_messages(conversation_id, created_at desc)`, `agent_outbound_queue(status, scheduled_for)`, `agent_channels(provider, status)`.
- `agent-runtime` invocation from webhooks runs with service role + a synthetic `actor` so per-user RLS does not block tool calls.
