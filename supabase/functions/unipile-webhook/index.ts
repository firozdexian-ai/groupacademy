// Unipile webhook receiver — per-channel secret in query string
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const channelId = url.searchParams.get("c");
  const cs = url.searchParams.get("cs");
  if (!channelId || !cs) return new Response("missing params", { status: 400 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: channel } = await admin
    .from("messaging_channels")
    .select("id, agent_key, provider, auto_reply_enabled, metadata, unipile_account_id, status")
    .eq("id", channelId)
    .maybeSingle();
  if (!channel) return new Response("channel not found", { status: 404 });
  if ((channel.metadata as any)?.webhook_secret !== cs) return new Response("forbidden", { status: 403 });

  // Hosted-auth success redirect: GET with query
  if (req.method === "GET") {
    return new Response("<html><body><h2>WhatsApp connected. You can close this window.</h2></body></html>", {
      headers: { "Content-Type": "text/html" },
    });
  }

  let payload: any = {};
  try { payload = await req.json(); } catch { /* may be empty */ }

  // Account-status events from hosted-auth notify
  if (payload?.account_id && (payload?.status || payload?.AccountStatus || payload?.name)) {
    const status = (payload.status || payload.AccountStatus || "").toString().toUpperCase();
    const accountId = payload.account_id;
    await admin.from("messaging_channels").update({
      unipile_account_id: accountId,
      status: status.includes("OK") || status.includes("CONNECT") ? "active" : "pending",
      phone_e164: payload.phone || payload.phone_number || null,
      metadata: { ...(channel.metadata as any), last_account_event: payload },
      updated_at: new Date().toISOString(),
    }).eq("id", channelId);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }

  // Inbound message event
  // Unipile messaging webhook shape: { event, message: { id, chat_id, attendee, sender_id, text, timestamp }, account_id }
  const ev = payload?.event || payload?.type;
  const msg = payload?.message || payload;
  const externalChatId = msg?.chat_id || msg?.thread_id || msg?.chat?.id;
  const externalMsgId = msg?.id || msg?.message_id;
  const senderId = msg?.sender_id || msg?.attendee_provider_id || msg?.from?.id;
  const isFromMe = msg?.is_sender === true || msg?.from_me === true;
  const text = msg?.text || msg?.body || msg?.content || "";
  const senderName = msg?.attendee_name || msg?.sender_name || msg?.from?.name || null;

  if (!externalChatId) {
    return new Response(JSON.stringify({ ignored: true, reason: "no chat id" }), { headers: { "Content-Type": "application/json" } });
  }

  // Upsert conversation
  const { data: existingConv } = await admin
    .from("messaging_conversations")
    .select("id, auto_reply_paused, metadata")
    .eq("channel_id", channelId)
    .eq("external_chat_id", externalChatId)
    .maybeSingle();

  let conversationId = existingConv?.id;
  if (!conversationId) {
    // Try to link to existing talent by phone (WhatsApp peer id is usually phone@s.whatsapp.net)
    const phone = senderId ? String(senderId).split("@")[0].replace(/\D/g, "") : null;
    let talentId: string | null = null;
    if (phone) {
      const { data: talentMatch } = await admin.from("talents").select("id").ilike("phone", `%${phone.slice(-9)}%`).limit(1).maybeSingle();
      talentId = talentMatch?.id ?? null;
      if (!talentId && !isFromMe) {
        // Auto-create lightweight talent
        const { data: newT } = await admin.from("talents").insert({
          full_name: senderName || `WhatsApp ${phone.slice(-4)}`,
          email: `wa_${phone}@inbound.placeholder`,
          phone: `+${phone}`,
          current_status: "lead",
          verification_status: "unverified",
        }).select("id").single();
        talentId = newT?.id ?? null;
      }
    }

    const { data: newConv } = await admin.from("messaging_conversations").insert({
      channel_id: channelId,
      external_chat_id: externalChatId,
      peer_handle: senderId ?? null,
      peer_display_name: senderName,
      metadata: { talent_id: talentId, source: "unipile" },
    }).select("id").single();
    conversationId = newConv?.id;
  }
  if (!conversationId) return new Response("conv error", { status: 500 });

  // Insert message
  await admin.from("messaging_messages").insert({
    conversation_id: conversationId,
    external_message_id: externalMsgId ?? null,
    direction: isFromMe ? "out" : "in",
    author: isFromMe ? "human_operator" : "user",
    body: text,
    status: "delivered",
  });

  await admin.from("messaging_conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: text.slice(0, 200),
    unread_count: isFromMe ? 0 : (existingConv ? undefined : 1),
    updated_at: new Date().toISOString(),
  }).eq("id", conversationId);

  // Auto-reply trigger
  if (!isFromMe && channel.auto_reply_enabled && !existingConv?.auto_reply_paused) {
    fetch(`${SUPABASE_URL}/functions/v1/messaging-autoreply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ conversation_id: conversationId }),
    }).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
