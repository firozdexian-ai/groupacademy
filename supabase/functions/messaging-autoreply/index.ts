// AI auto-reply for messaging conversations
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { conversation_id } = await req.json();
    if (!conversation_id) return new Response("missing", { status: 400 });

    const { data: conv } = await admin.from("messaging_conversations")
      .select("id, channel_id, peer_display_name, auto_reply_paused")
      .eq("id", conversation_id).maybeSingle();
    if (!conv || conv.auto_reply_paused) return new Response(JSON.stringify({ skipped: true }));

    const { data: channel } = await admin.from("messaging_channels")
      .select("agent_key, label, region, language, auto_reply_enabled")
      .eq("id", conv.channel_id).single();
    if (!channel?.auto_reply_enabled) return new Response(JSON.stringify({ skipped: true }));

    // Consolidated routing: resolve the agent persona from the central ai_agents registry
    // (same source of truth as admin-agents-router). No more hardcoded prompts.
    const { data: agentCfg } = await admin
      .from("ai_agents")
      .select("system_prompt, name, model, is_active")
      .eq("agent_key", channel.agent_key)
      .maybeSingle();

    if (!agentCfg || agentCfg.is_active === false) {
      console.warn(`[messaging-autoreply] agent_key '${channel.agent_key}' not found or inactive in ai_agents`);
      return new Response(JSON.stringify({ skipped: true, reason: "agent_not_registered" }));
    }

    const { data: history } = await admin.from("messaging_messages")
      .select("direction, author, body, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const messages = (history ?? []).reverse().map((m: any) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body || "",
    }));

    const systemPrompt = `${agentCfg.system_prompt}\n\n---\nCHANNEL CONTEXT: You are replying over WhatsApp on the "${channel.label}" line${channel.region ? ` (${channel.region})` : ""}. Keep replies to 1-3 short sentences. Reply in the user's language. Escalate complex queries by saying a human teammate will follow up.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: agentCfg.model || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });
    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("AI error", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }
    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content?.trim();
    if (!reply) return new Response(JSON.stringify({ skipped: true, reason: "empty" }));

    await fetch(`${SUPABASE_URL}/functions/v1/messaging-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ conversation_id, text: reply }),
    });

    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
