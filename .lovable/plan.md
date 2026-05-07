## Option B — Activate now + harden

### Step 1 — Activate both lines (one-shot, via existing Verify & save)

From your Unipile screenshot we already have both account IDs:

| Line | Phone | account_id |
|---|---|---|
| Talent | 8801889825025 | `mYl_4PSKSFSSaPLhRE4E9w` |
| Employer | 8801708459008 | `mkPpEOHeSWyyMNrztwcTmg` |

I'll call `unipile-connect` with `action: verify_and_save` for each, which will:
- Fetch the account from Unipile and confirm `WHATSAPP`
- Update the `messaging_channels` row → `status='active'`, set `unipile_account_id` + `phone_e164`
- Register the inbound-messaging webhook idempotently in the background

(No UI clicking required — done from the function call.)

### Step 2 — Harden `unipile-connect` with a `reconcile` action

Add a new action so we never get stuck with a half-linked row again:

- **`reconcile`** — given an `agent_key`, list Unipile accounts (`GET /api/v1/accounts`), find the WhatsApp account whose `name === "group-<agent_key>"` (we already set this in `start_hosted_auth` via the `name` field). If found, run the same logic as `verify_and_save` — write `account_id`, `phone_e164`, flip to `active`, register webhook.
- **`start_hosted_auth` tweak** — also stash `hosted_link_id` (and `expiresOn`) inside `metadata` so the Reconcile step has a second matching key as fallback.

### Step 3 — Surface "Reconcile" in the UI

In `MessagingChannelsTab.tsx`, when a channel row's `status !== 'active'` and there's no `unipile_account_id`, show a small **"Reconcile from Unipile"** button next to the row. Clicking it calls `action: "reconcile"` and a toast confirms activation. This means non-technical admins never have to copy/paste a UUID.

### Step 4 — Verify

After implementing, I'll re-query `messaging_channels` and confirm both Talent and Employer rows show `status=active` with their phone + account_id populated. Community Engine will stay pending until you scan its QR.

### Files to change

- `supabase/functions/unipile-connect/index.ts` — add `reconcile` action + persist `hosted_link_id` in metadata
- `src/components/dashboard/messaging/MessagingChannelsTab.tsx` — add Reconcile button on pending rows

No DB migrations, no schema changes.
