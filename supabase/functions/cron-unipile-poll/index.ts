// cron-unipile-poll — safety net poller for Unipile-hosted WhatsApp lines.
// Every ~2 min: for each connected messaging_channel with a unipile_account_id,
// fetch recent chats, then for each chat fetch messages newer than the last
// polled cursor and replay them into unipile-webhook. Idempotency is enforced
// downstream by messaging_messages.external_message_id uniqueness.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;

async function uni(path: string) {
  const res = await fetch(`https://${UNIPILE_DSN}${path}`, {
    headers: { "X-API-KEY": UNIPILE_API_KEY, accept: "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: channels } = await admin
    .from("messaging_channels")
    .select("id, agent_key, unipile_account_id, metadata, status")
    .eq("status", "connected")
    .not("unipile_account_id", "is", null);

  const summary: any[] = [];

  for (const ch of channels ?? []) {
    const accId = ch.unipile_account_id as string;
    const meta = (ch.metadata as any) ?? {};
    const cs = meta.webhook_secret;
    const lastPolled = meta.last_poll_at ? new Date(meta.last_poll_at).getTime() : Date.now() - 10 * 60_000;
    if (!cs) { summary.push({ channel: ch.id, skipped: "no webhook_secret" }); continue; }

    let replayed = 0, scanned = 0, errors = 0;
    try {
      const chats = await uni(`/api/v1/chats?account_id=${accId}&limit=20`);
      const items: any[] = chats.body?.items ?? [];
      for (const c of items) {
        const chatTs = c.timestamp ? new Date(c.timestamp).getTime() : 0;
        if (chatTs <= lastPolled) continue;
        scanned++;
        const msgs = await uni(`/api/v1/chats/${c.id}/messages?limit=10`);
        const mItems: any[] = msgs.body?.items ?? [];
        // Oldest-first replay
        for (const m of mItems.slice().reverse()) {
          const ts = m.timestamp ? new Date(m.timestamp).getTime() : 0;
          if (ts <= lastPolled) continue;
          if (m.is_sender) continue; // only inbound
          const payload = {
            message: {
              chat_id: c.id,
              id: m.id ?? m.message_id,
              sender_id: m.sender_id,
              is_sender: false,
              text: m.text ?? m.body ?? "",
              attendee_name: m.sender_name ?? c.name ?? null,
              chat: { type: c.is_group ? "group" : "private" },
            },
          };
          const r = await fetch(
            `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${ch.id}&cs=${cs}`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
          );
          if (r.ok) replayed++; else errors++;
          await r.text().catch(() => {});
        }
      }
      await admin
        .from("messaging_channels")
        .update({ metadata: { ...meta, last_poll_at: new Date().toISOString(), last_poll_replayed: replayed } })
        .eq("id", ch.id);
    } catch (e) {
      errors++;
    }
    summary.push({ channel: ch.id, agent: ch.agent_key, scanned, replayed, errors });
  }

  return new Response(JSON.stringify({ ok: true, channels: summary, ts: new Date().toISOString() }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
