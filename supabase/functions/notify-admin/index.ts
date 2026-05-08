// notify-admin: agent tool that pings the admin team via Telegram.
// Inputs: { channel?: 'telegram', message: string, context?: object }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated caller (agent runtime forwards the user JWT).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ ok: false, error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const channel = (body.channel ?? "telegram") as string;
    const message = String(body.message ?? "").trim();
    if (!message) return json({ ok: false, error: "message_required" }, 400);
    if (message.length > 2000) return json({ ok: false, error: "message_too_long" }, 400);
    if (channel !== "telegram") return json({ ok: false, error: "unsupported_channel" }, 400);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    if (!botToken || !chatId) {
      console.log("[notify-admin] skipped — Telegram secrets missing");
      return json({ ok: true, skipped: true }, 200);
    }

    const text = `🔔 Agent alert\n${message}\n\n— from ${user.email ?? user.id}`;
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!r.ok) console.error("[notify-admin] telegram non-2xx:", r.status, await r.text());
    return json({ ok: r.ok }, 200);
  } catch (e) {
    console.error("[notify-admin] error:", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
