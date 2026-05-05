## Goal

Enable each AI agent (starting with **Talent Executive — Bangladesh**) to own its own WhatsApp and Telegram numbers, send/receive real two-way messages (replacing the current `wa.me` link buttons), and let the agent auto-reply while supporting human takeover.

The DB schema (`messaging_channels`, `messaging_conversations`, `messaging_messages`, `messaging_outbound_queue`, `messaging_templates`) is already in place. This plan covers everything that comes after.

---

## Step 1 — Credentials & connectors

1. Add two project secrets via `add_secret`:
   - `UNIPILE_API_KEY`
   - `UNIPILE_DSN` (e.g. `api8.unipile.com:13852`)
2. Link the **Telegram** standard connector via `standard_connectors--connect` (Lovable-managed gateway, no raw bot token needed).

No global webhook secret — each channel row gets its own random `webhook_secret` stored in `messaging_channels.metadata` (pattern from Rob's Sales Hub).

---

## Step 2 — Edge Functions

Create five functions under `supabase/functions/`:

| Function | verify_jwt | Purpose |
|---|---|---|
| `unipile-connect` | true | Calls Unipile `POST /api/v1/hosted/accounts/link` to get a hosted auth URL (QR for WhatsApp). Returns URL to the admin UI. |
| `unipile-webhook` | false | Receives Unipile events (`messaging.new`, `account.status`). Verifies `?cs=<webhook_secret>&c=<channel_id>`. Inserts inbound message, upserts conversation, auto-creates lightweight talent if sender unknown, triggers auto-reply. |
| `telegram-webhook` | false | Receives Telegram updates via Lovable gateway. Same secret-token validation pattern. |
| `messaging-send` | true | Operator/agent sends an outbound message. Routes to Unipile (`POST /api/v1/chats/{id}/messages`) or Telegram (`sendMessage` via gateway). Writes `messaging_messages` row. |
| `messaging-autoreply` | internal | Invoked by `unipile-webhook` / `telegram-webhook` when `auto_reply_enabled` and no human takeover. Builds context (last N messages + agent system prompt) and calls Lovable AI (`google/gemini-2.5-flash`). Posts the reply through `messaging-send`. |

Webhook URL pattern registered with Unipile per channel:
`https://<project>.supabase.co/functions/v1/unipile-webhook?c=<channel_id>&cs=<webhook_secret>`

---

## Step 3 — Auto-create lightweight talent

Inside `unipile-webhook` / `telegram-webhook`, when an inbound peer phone/handle has no match:
- Insert a minimal row into `talents` (name = peer display name, phone = E.164 if WhatsApp, source = `messaging_inbound`, status = `lead`).
- Link `messaging_conversations.talent_id` to it so admins see a unified profile.

---

## Step 4 — Admin UI: Agent Channels tab

In the Talent Executive — Bangladesh agent management page (existing AI Agents admin area), add a **Channels** sub-tab with:

1. **Connect WhatsApp** button → calls `unipile-connect` → opens Unipile hosted QR in a new tab → on success, Unipile webhook fires `account.created` and we persist `unipile_account_id` on the `messaging_channels` row.
2. **Connect Telegram** button → guides user to message the connector bot once, then we map the `chat_id` to the channel.
3. List of connected channels with: provider, region, phone/handle, status (`active`/`disconnected`), `auto_reply_enabled` toggle, **Disconnect** button.
4. Per-channel **Templates** mini-editor (writes `messaging_templates`).

---

## Step 5 — Inbox UI

New route `/dashboard/admin/messaging` (operators with `talent_success_executive` role + admins):

- Left rail: conversations list (filter by channel, unread first, search by peer name/phone).
- Right pane: WhatsApp-style thread, realtime via `supabase.channel('messaging_messages')`.
- Composer: free text, template picker, "Take over from AI" toggle (sets `human_takeover = true`, pauses auto-reply).
- Header shows linked talent card with quick link to full talent profile.

---

## Step 6 — Replace existing `wa.me` buttons

Wherever the platform currently does `window.open('https://wa.me/...?text=...')` (talent outreach, job referral, etc.):

- If the acting agent has an active WhatsApp channel → call `messaging-send` to dispatch directly and open the conversation in the inbox.
- Otherwise → keep the `wa.me` fallback (no regression).

---

## Step 7 — Outbound queue worker

A scheduled function (cron via `pg_cron` calling an edge function every minute) drains `messaging_outbound_queue` respecting per-channel throttle (`rate_limit_per_minute` in `metadata`). Used for bulk outreach campaigns later — not required for the pilot but the table is ready.

---

## Pilot scope (what ships first)

Steps 1, 2 (`unipile-connect`, `unipile-webhook`, `messaging-send`, `messaging-autoreply`), 3, 4, 5, and Step 6 for the Talent Executive — Bangladesh agent only. Telegram + queue worker can land in a follow-up once WhatsApp is verified end-to-end.

---

## What I need from you to start

- Approve `add_secret` for `UNIPILE_API_KEY` and `UNIPILE_DSN` (you said you have them).
- Approve the Telegram connector link (or say "WhatsApp only for now" and I'll skip Telegram in the pilot).
- Confirm the pilot agent slug/ID is the existing **Talent Executive — Bangladesh** agent, or tell me which one.