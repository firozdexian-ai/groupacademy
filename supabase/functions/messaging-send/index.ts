// Outbound message dispatcher
// Supports:
//  - sending into an existing Unipile chat (external_chat_id present)
//  - starting a new 1-on-1 WhatsApp chat when external_chat_id looks like a raw phone
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
      if (!authHeader.startsWith("Bearer ")) return jsonResp({ error: "Unauthorized" }, 401);
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser(token);
      userId = userData?.user?.id ?? null;
      if (!userId || userErr) return jsonResp({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const { conversation_id, text, agent_run_id } = body ?? {};
    if (!conversation_id || !text) {
      return jsonResp({ error: "conversation_id and text required" }, 400);
    }

    const { data: conv } = await admin
      .from("messaging_conversations")
      .select("id, external_chat_id, channel_id, peer_handle, contact_id")
      .eq("id", conversation_id)
      .maybeSingle();
    if (!conv) return jsonResp({ error: "conversation not found" }, 404);

    const { data: channel } = await admin
      .from("messaging_channels")
      .select("id, provider, unipile_account_id, telegram_connection_key, status")
      .eq("id", conv.channel_id)
      .single();
    if (!channel) return jsonResp({ error: "channel missing" }, 404);

    let externalMessageId: string | null = null;
    let externalChatId: string | null = conv.external_chat_id ?? null;
    let status = "sent";
    let errorMsg: string | null = null;

    if (channel.provider === "whatsapp") {
      if (!UNIPILE_API_KEY || !UNIPILE_DSN || !channel.unipile_account_id) {
        return jsonResp({ error: "Unipile not configured for channel" }, 400);
      }
      if (channel.status !== "connected") {
        return jsonResp({ error: `Channel status is '${channel.status}', not connected` }, 400);
      }
      const dsnBase = UNIPILE_DSN.startsWith("http") ? UNIPILE_DSN : `https://${UNIPILE_DSN}`;

      // Detect whether external_chat_id is a real Unipile chat ID (UUID-ish)
      // versus a raw phone number we stored when creating an outbound conversation.
      const looksLikePhone = !!externalChatId && /^\+?\d{7,15}$/.test(externalChatId.replace(/\D/g, ""));
      const hasRealChat = !!externalChatId && !looksLikePhone;

      let r: Response;
      if (hasRealChat) {
        r = await fetch(`${dsnBase}/api/v1/chats/${externalChatId}/messages`, {
          method: "POST",
          headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json",
          },
          body: JSON.stringify({ text }),
        });
      } else {
        // Start a brand-new 1-on-1 chat using the contact's phone as attendee
        const phoneDigits = (externalChatId || conv.peer_handle || "").replace(/\D/g, "");
        if (!phoneDigits) {
          return jsonResp({ error: "no chat id and no phone to start chat" }, 400);
        }
        r = await fetch(`${dsnBase}/api/v1/chats`, {
          method: "POST",
          headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json",
          },
          body: JSON.stringify({
            account_id: channel.unipile_account_id,
            attendees_ids: [phoneDigits],
            text,
          }),
        });
      }

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        status = "failed";
        errorMsg = (data?.title || data?.message || JSON.stringify(data)).toString().slice(0, 500);
      } else {
        externalMessageId = data?.message_id || data?.id || null;
        const newChatId = data?.chat_id || data?.thread_id || data?.chat?.id || null;
        if (newChatId && newChatId !== externalChatId) {
          externalChatId = newChatId;
          await admin
            .from("messaging_conversations")
            .update({ external_chat_id: newChatId })
            .eq("id", conversation_id);
        }
      }
    } else if (channel.provider === "telegram") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
      if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
        return jsonResp({ error: "Telegram connector not linked" }, 400);
      }
      const r = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: externalChatId, text }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        status = "failed";
        errorMsg = JSON.stringify(data).slice(0, 500);
      } else {
        externalMessageId = String(data?.result?.message_id ?? "");
      }
    }

    const { data: insertedMsg } = await admin
      .from("messaging_messages")
      .insert({
        conversation_id,
        external_message_id: externalMessageId,
        direction: "out",
        author: agent_run_id ? "agent" : "human_operator",
        body: text,
        status: status as any,
        error: errorMsg,
        agent_run_id: agent_run_id ?? null,
        sent_by_user_id: userId,
      })
      .select("id")
      .single();

    await admin
      .from("messaging_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text.slice(0, 200),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation_id);

    return jsonResp({
      ok: status === "sent",
      message_id: insertedMsg?.id,
      external_message_id: externalMessageId,
      external_chat_id: externalChatId,
      error: errorMsg,
    });
  } catch (e) {
    return jsonResp({ error: (e as Error).message }, 500);
  }
});
