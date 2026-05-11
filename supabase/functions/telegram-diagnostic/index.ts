// telegram-diagnostic: Reads recent Telegram bot updates and returns
// the last unique chats that have messaged the bot. Used to discover
// the correct chat_id when a user is debugging notify-stakeholder.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return j({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured in the backend." }, 400);
    }

    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=100`);
    const payload = await r.json().catch(() => null);

    if (!r.ok || !payload?.ok) {
      return j({
        ok: false,
        error: `Telegram API rejected getUpdates (${r.status}): ${payload?.description ?? "unknown"}`,
      }, 502);
    }

    const updates: any[] = Array.isArray(payload.result) ? payload.result : [];
    const seen = new Set<string>();
    const chats: Array<{
      chat_id: string;
      username: string | null;
      first_name: string | null;
      last_name: string | null;
      chat_type: string | null;
      text: string | null;
      date: number | null;
    }> = [];

    // Newest first
    for (const u of updates.slice().reverse()) {
      const m = u.message ?? u.edited_message ?? u.channel_post ?? u.my_chat_member ?? null;
      if (!m?.chat?.id) continue;
      const id = String(m.chat.id);
      if (seen.has(id)) continue;
      seen.add(id);
      chats.push({
        chat_id: id,
        username: m.chat.username ?? m.from?.username ?? null,
        first_name: m.chat.first_name ?? m.from?.first_name ?? m.chat.title ?? null,
        last_name: m.chat.last_name ?? m.from?.last_name ?? null,
        chat_type: m.chat.type ?? null,
        text: m.text ?? m.caption ?? null,
        date: m.date ?? null,
      });
      if (chats.length >= 10) break;
    }

    return j({ ok: true, count: chats.length, total_updates: updates.length, chats });
  } catch (e) {
    console.error("[telegram-diagnostic] fault", e);
    return j({ ok: false, error: String(e) }, 500);
  }
});

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
