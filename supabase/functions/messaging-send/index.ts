// Outbound message dispatcher
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN");

    const authHeader = req.headers.get("Authorization") ?? "";
    const isService = authHeader === `Bearer ${SERVICE_KEY}`;
    let userId: string | null = null;
    if (!isService) {
      if (!authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      userId = data?.claims?.sub ?? null;
      if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();
    const { conversation_id, text, agent_run_id } = body ?? {};
    if (!conversation_id || !text) {
      return new Response(JSON.stringify({ error: "conversation_id and text required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id").eq("id", conversation_id).maybeSingle();
    if (!conv) return new Response(JSON.stringify({ error: "conversation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: channel } = await admin.from("messaging_channels").select("id, provider, unipile_account_id, telegram_connection_key").eq("id", conv.channel_id).single();
    if (!channel) return new Response(JSON.stringify({ error: "channel missing" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let externalMessageId: string | null = null;
    let status = "sent";
    let errorMsg: string | null = null;

    if (channel.provider === "whatsapp") {
      if (!UNIPILE_API_KEY || !UNIPILE_DSN || !channel.unipile_account_id) {
        return new Response(JSON.stringify({ error: "Unipile not configured for channel" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const dsnBase = UNIPILE_DSN.startsWith("http") ? UNIPILE_DSN : `https://${UNIPILE_DSN}`;
      const r = await fetch(`${dsnBase}/api/v1/chats/${conv.external_chat_id}/messages`, {
        method: "POST",
        headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) { status = "failed"; errorMsg = JSON.stringify(data); }
      else { externalMessageId = data?.message_id || data?.id || null; }
    } else if (channel.provider === "telegram") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
      if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
        return new Response(JSON.stringify({ error: "Telegram connector not linked" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const r = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
        method: "POST",
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": TELEGRAM_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: conv.external_chat_id, text }),
      });
      const data = await r.json();
      if (!r.ok) { status = "failed"; errorMsg = JSON.stringify(data); }
      else { externalMessageId = String(data?.result?.message_id ?? ""); }
    }

    const { data: insertedMsg } = await admin.from("messaging_messages").insert({
      conversation_id,
      external_message_id: externalMessageId,
      direction: "out",
      author: agent_run_id ? "agent" : "human_operator",
      body: text,
      status: status as any,
      error: errorMsg,
      agent_run_id: agent_run_id ?? null,
      sent_by_user_id: userId,
    }).select("id").single();

    await admin.from("messaging_conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: text.slice(0, 200),
      updated_at: new Date().toISOString(),
    }).eq("id", conversation_id);

    return new Response(JSON.stringify({ ok: status === "sent", message_id: insertedMsg?.id, error: errorMsg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
