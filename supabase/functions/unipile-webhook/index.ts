// Unipile webhook receiver — 3-tier resolver (Triple-Number Architecture)
// Channels are differentiated via messaging_channels.agent_key:
//   talent-outreach    → may auto-create talents (existing behavior preserved)
//   employer-outreach  → never auto-creates talents; employer-aware auto-reply
//   community-engine   → default home for incoming groups
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

  // ---- Account-status events (hosted-auth notify) ----
  if (payload?.account_id && (payload?.status || payload?.AccountStatus || payload?.name)) {
    const status = (payload.status || payload.AccountStatus || "").toString().toUpperCase();
    const accountId = payload.account_id;
    await admin.from("messaging_channels").update({
      unipile_account_id: accountId,
      status: status.includes("OK") || status.includes("CONNECT") ? "connected" : "pending",
      phone_e164: payload.phone || payload.phone_number || (channel as any).phone_e164 || null,
      metadata: { ...(channel.metadata as any), last_account_event: payload },
      updated_at: new Date().toISOString(),
    }).eq("id", channelId);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }

  // ---- Inbound message event ----
  const msg = payload?.message || payload;
  const externalChatId: string | undefined = msg?.chat_id || msg?.thread_id || msg?.chat?.id;
  const externalMsgId: string | undefined = msg?.id || msg?.message_id;
  const senderId: string | undefined = msg?.sender_id || msg?.attendee_provider_id || msg?.from?.id;
  const isFromMe: boolean = msg?.is_sender === true || msg?.from_me === true;
  const text: string = msg?.text || msg?.body || msg?.content || "";
  const senderName: string | null = msg?.attendee_name || msg?.sender_name || msg?.from?.name || null;
  // Some Unipile payloads expose chat type; we also fall back to JID suffix
  const chatTypeHint: string | undefined = (msg?.chat?.type || msg?.chat_type || payload?.chat?.type)?.toString().toLowerCase();
  const isGroup = chatTypeHint === "group" || /@g\.us$/i.test(externalChatId ?? "");

  if (!externalChatId) {
    return new Response(JSON.stringify({ ignored: true, reason: "no chat id" }), { headers: { "Content-Type": "application/json" } });
  }

  const agentKey: string = channel.agent_key;
  const phone = senderId ? String(senderId).split("@")[0].replace(/\D/g, "") : null;

  // Look up existing conversation
  const { data: existingConv } = await admin
    .from("messaging_conversations")
    .select("id, auto_reply_paused, metadata, is_group, contact_id, company_id, group_kind")
    .eq("channel_id", channelId)
    .eq("external_chat_id", externalChatId)
    .maybeSingle();

  let conversationId = existingConv?.id;
  let resolvedContactId: string | null = existingConv?.contact_id ?? null;
  let resolvedCompanyId: string | null = existingConv?.company_id ?? null;
  let resolvedTalentId: string | null = (existingConv?.metadata as any)?.talent_id ?? null;
  let convCreated = false;

  if (!conversationId) {
    // ============ GROUP PATH ============
    if (isGroup) {
      // Default group_kind by channel
      let groupKind: string;
      if (agentKey === "community-engine") groupKind = "community";
      else if (agentKey === "employer-outreach") groupKind = "client_success";
      else groupKind = "internal"; // talent line shouldn't host public groups

      const { data: newConv } = await admin.from("messaging_conversations").insert({
        channel_id: channelId,
        external_chat_id: externalChatId,
        peer_handle: senderId ?? null,
        peer_display_name: senderName,
        is_group: true,
        group_kind: groupKind,
        metadata: { source: "unipile", inbound_origin: agentKey },
      }).select("id").single();
      conversationId = newConv?.id;
      convCreated = true;
    } else {
      // ============ 1-ON-1 PATH (3-tier resolver) ============

      // Tier 1 — Employer match by WhatsApp number on contacts (any channel)
      if (phone) {
        const { data: contactMatch } = await admin
          .from("contacts")
          .select("id, company_id")
          .eq("whatsapp_number", phone)
          .maybeSingle();
        if (contactMatch) {
          resolvedContactId = contactMatch.id;
          resolvedCompanyId = contactMatch.company_id ?? null;
        }
      }

      // Tier 2 — Talent match (only the talent-outreach line may auto-create talents)
      if (!resolvedContactId && agentKey === "talent-outreach" && phone) {
        const { data: talentMatch } = await admin
          .from("talents")
          .select("id")
          .ilike("phone", `%${phone.slice(-9)}%`)
          .limit(1)
          .maybeSingle();
        resolvedTalentId = talentMatch?.id ?? null;

        if (!resolvedTalentId && !isFromMe) {
          // EXISTING auto-create behavior — preserved exactly
          const { data: newT } = await admin.from("talents").insert({
            full_name: senderName || `WhatsApp ${phone.slice(-4)}`,
            email: `wa_${phone}@inbound.placeholder`,
            phone: `+${phone}`,
            current_status: "lead",
            verification_status: "unverified",
          }).select("id").single();
          resolvedTalentId = newT?.id ?? null;
        }
      }

      // Tier 3 — Unknown peer on employer-outreach or community-engine:
      // SAVE the message but do NOT auto-create talents and do NOT auto-reply.
      // Privacy: Outreach Console filters require contact_id IS NOT NULL OR is_group=true,
      // so personal chats on these lines never surface in admin UI.

      const { data: newConv } = await admin.from("messaging_conversations").insert({
        channel_id: channelId,
        external_chat_id: externalChatId,
        peer_handle: senderId ?? null,
        peer_display_name: senderName,
        is_group: false,
        contact_id: resolvedContactId,
        company_id: resolvedCompanyId,
        metadata: { talent_id: resolvedTalentId, source: "unipile", inbound_origin: agentKey },
      }).select("id").single();
      conversationId = newConv?.id;
      convCreated = true;
    }
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

  // ---- Auto-reply gating ----
  // Never auto-reply to groups. Never auto-reply on tier-3 unknown peers.
  const wasGroup = (existingConv?.is_group ?? isGroup) === true;
  const hasContact = !!(existingConv?.contact_id ?? resolvedContactId);
  const hasTalent = !!((existingConv?.metadata as any)?.talent_id ?? resolvedTalentId);
  const tierResolved = hasContact || hasTalent;

  if (!isFromMe && channel.auto_reply_enabled && !existingConv?.auto_reply_paused && !wasGroup && tierResolved) {
    fetch(`${SUPABASE_URL}/functions/v1/messaging-autoreply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ conversation_id: conversationId }),
    }).catch(() => {});
  }

  return new Response(JSON.stringify({
    ok: true,
    conversation_id: conversationId,
    is_group: wasGroup,
    agent_key: agentKey,
    created: convCreated,
  }), { headers: { "Content-Type": "application/json" } });
});
