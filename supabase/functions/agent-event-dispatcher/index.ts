// Phase E — Proactive Engine dispatcher.
// Runs every minute. Pulls unprocessed platform_events, matches to
// agent_triggers, dedupes per (agent, recipient, event_kind, 24h),
// generates the message via Lovable AI, then delivers via either:
//   - in_app  → notifications (cost 0.5)
//   - whatsapp → messaging-send via Unipile (cost 2.0), with cold-start
//                fail-soft to in_app when phone or channel is missing.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const BATCH = 25;
const MODEL = "google/gemini-2.5-flash-lite";
const COST_IN_APP = 0.5;
const COST_WHATSAPP = 2.0;

interface PlatformEvent {
  id: string;
  event_kind: string;
  subject_kind: string | null;
  subject_id: string | null;
  payload: Record<string, unknown>;
}
interface AgentTrigger {
  id: string;
  agent_id: string;
  event_kind: string;
  recipient_strategy: string;
  recipient_filter: Record<string, unknown>;
  template: string;
  channel: string | null;
  cooldown_minutes: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: events, error: evErr } = await admin
      .from("platform_events")
      .select("id, event_kind, subject_kind, subject_id, payload")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(BATCH);
    if (evErr) throw evErr;
    if (!events?.length) return json({ ok: true, processed: 0 });

    let dispatched = 0, skipped = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const evt of events as PlatformEvent[]) {
      const { data: triggers } = await admin
        .from("agent_triggers")
        .select("id, agent_id, event_kind, recipient_strategy, recipient_filter, template, channel, cooldown_minutes")
        .eq("event_kind", evt.event_kind)
        .eq("is_active", true);

      for (const trig of (triggers || []) as AgentTrigger[]) {
        try {
          const r = await runTrigger(admin, evt, trig);
          if (r.dispatched) dispatched++; else skipped++;
          results.push({ event: evt.id, trigger: trig.id, ...r });
        } catch (e) {
          console.error("trigger run failed", trig.id, e);
          results.push({ event: evt.id, trigger: trig.id, error: String(e) });
        }
      }

      await admin.from("platform_events").update({ processed_at: new Date().toISOString() }).eq("id", evt.id);
    }

    return json({ ok: true, events: events.length, dispatched, skipped, results });
  } catch (err) {
    console.error("dispatcher fatal", err);
    return json({ error: String(err) }, 500);
  }
});

async function runTrigger(admin: any, evt: PlatformEvent, trig: AgentTrigger) {
  const { data: agent } = await admin
    .from("ai_agents")
    .select("id, agent_key, name, system_prompt, kill_switch, is_active, default_channel, region")
    .eq("id", trig.agent_id).maybeSingle();

  if (!agent || !agent.is_active || agent.kill_switch) {
    return { dispatched: false, reason: "agent_disabled" };
  }

  const recipient = resolveRecipient(trig, evt);
  if (!recipient) return { dispatched: false, reason: "no_recipient" };

  // Decide channel: trigger override > agent default > in_app
  let channel: string = trig.channel || agent.default_channel || "in_app";

  // Resolve recipient phone if WhatsApp requested
  let recipientPhone: string | null = null;
  let recipientName: string | null = null;
  if (channel === "whatsapp") {
    const r = await resolveRecipientPhone(admin, recipient);
    recipientPhone = r.phone;
    recipientName = r.name;
    if (!recipientPhone || recipient.kind === "admin") {
      // Fail-soft: route to in_app
      channel = "in_app";
    }
  }

  // 24h dedupe (cooldown configurable per trigger)
  const { data: ok } = await admin.rpc("try_dedupe_outreach", {
    p_agent_id: agent.id,
    p_recipient_kind: recipient.kind,
    p_recipient_id: recipient.id,
    p_event_kind: trig.event_kind,
    p_cooldown_minutes: trig.cooldown_minutes ?? 1440,
  });
  if (!ok) return { dispatched: false, reason: "cooldown" };

  const cost = channel === "whatsapp" ? COST_WHATSAPP : COST_IN_APP;
  const { data: charge, error: chargeErr } = await admin.rpc("headless_pool_charge", {
    p_amount: cost, p_reason: `${agent.agent_key} -> ${trig.event_kind} (${channel})`,
  });
  if (chargeErr || !(charge as any)?.success) {
    await admin.from("agent_outreach").insert({
      agent_id: agent.id, trigger_id: trig.id, event_id: evt.id,
      recipient_kind: recipient.kind, recipient_id: recipient.id,
      channel, subject: trig.event_kind, body: trig.template,
      payload: evt.payload as any, status: "failed",
      error_message: (charge as any)?.error || chargeErr?.message || "pool_charge_failed",
      credits_charged: 0,
    });
    return { dispatched: false, reason: "pool_unavailable" };
  }

  const body = await generateMessage(agent, trig, evt);

  let conversationId: string | null = null;
  let externalMessageId: string | null = null;
  let status = "sent";
  let errorMsg: string | null = null;

  if (channel === "whatsapp" && recipientPhone) {
    try {
      const conv = await resolveOrCreateConversation(admin, agent.agent_key, agent.region, recipientPhone, recipientName, recipient);
      if (!conv) {
        status = "failed";
        errorMsg = "no_messaging_channel";
      } else {
        conversationId = conv.id;
        const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/messaging-send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            apikey: SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({ conversation_id: conv.id, text: body }),
        });
        const sendJson = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok || sendJson?.error) {
          status = "failed";
          errorMsg = String(sendJson?.error || `send_${sendRes.status}`).slice(0, 500);
        } else {
          externalMessageId = sendJson?.external_message_id ?? null;
        }
      }
    } catch (e) {
      status = "failed";
      errorMsg = (e as Error).message.slice(0, 500);
    }
  } else if (recipient.kind === "talent" && recipient.id) {
    // in_app: mirror to notifications
    await admin.from("notifications").insert({
      talent_id: recipient.id, type: "agent_outreach",
      title: agent.name, message: body.length > 220 ? body.slice(0, 217) + "…" : body,
      icon: "sparkles",
    });
  }

  const { data: outreach } = await admin.from("agent_outreach").insert({
    agent_id: agent.id, trigger_id: trig.id, event_id: evt.id,
    recipient_kind: recipient.kind, recipient_id: recipient.id,
    channel, subject: agent.name, body, payload: evt.payload as any,
    status, error_message: errorMsg, credits_charged: cost,
    conversation_id: conversationId, external_message_id: externalMessageId,
  }).select("id").single();

  await admin.from("agent_triggers").update({ last_fired_at: new Date().toISOString() }).eq("id", trig.id);
  return { dispatched: status === "sent", outreach_id: outreach?.id, channel, reason: errorMsg ?? undefined };
}

function resolveRecipient(trig: AgentTrigger, evt: PlatformEvent) {
  switch (trig.recipient_strategy) {
    case "subject":
      if (!evt.subject_kind || !evt.subject_id) return null;
      if (evt.subject_kind === "talent") return { kind: "talent", id: evt.subject_id };
      if (evt.subject_kind === "company") return { kind: "company", id: evt.subject_id };
      return null;
    case "admin": return { kind: "admin", id: null };
    case "company": {
      const cid = (trig.recipient_filter?.company_id as string) || evt.subject_id;
      return cid ? { kind: "company", id: cid } : null;
    }
    case "custom": {
      const kind = trig.recipient_filter?.recipient_kind as string;
      const id = trig.recipient_filter?.recipient_id as string;
      if (!kind) return null;
      return { kind, id: id || null } as any;
    }
    default: return null;
  }
}

async function resolveRecipientPhone(admin: any, recipient: { kind: string; id: string | null }) {
  if (recipient.kind === "talent" && recipient.id) {
    const { data } = await admin.from("talents").select("phone, full_name").eq("id", recipient.id).maybeSingle();
    return { phone: normalizePhone(data?.phone), name: data?.full_name ?? null };
  }
  // companies have no phone field today → fail-soft
  return { phone: null, name: null };
}

function normalizePhone(p: string | null | undefined) {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

async function resolveOrCreateConversation(
  admin: any, agentKey: string, region: string | null,
  phone: string, name: string | null, recipient: { kind: string; id: string | null },
) {
  const q = admin.from("messaging_channels")
    .select("id, region")
    .eq("agent_key", agentKey)
    .eq("status", "connected")
    .eq("provider", "whatsapp");
  const { data: channels } = await q;
  if (!channels?.length) return null;
  const channel = channels.find((c: any) => !region || c.region === region) || channels[0];

  const { data: existing } = await admin.from("messaging_conversations")
    .select("id")
    .eq("channel_id", channel.id)
    .eq("external_chat_id", phone)
    .maybeSingle();
  if (existing) return existing;

  const { data: created } = await admin.from("messaging_conversations").insert({
    channel_id: channel.id,
    external_chat_id: phone,
    peer_handle: phone,
    peer_display_name: name,
    contact_id: recipient.kind === "talent" ? recipient.id : null,
    metadata: { source: "agent-event-dispatcher", agent_key: agentKey },
  }).select("id").single();
  return created;
}

async function generateMessage(agent: { name: string; system_prompt: string }, trig: AgentTrigger, evt: PlatformEvent) {
  const sys = `${agent.system_prompt}\n\nYou are sending a SHORT proactive message (2-4 sentences, max 320 chars). Be warm, specific, and end with one concrete next step. Plain text, no markdown.`;
  const user = `Event: ${evt.event_kind}\nPayload: ${JSON.stringify(evt.payload).slice(0, 1500)}\n\nUse this template/intent as a guide (rewrite naturally, do not echo verbatim):\n${trig.template}`;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        max_tokens: 220,
      }),
    });
    if (!res.ok) {
      console.error("AI gen failed", res.status, await res.text());
      return trig.template;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || trig.template;
  } catch (e) {
    console.error("AI gen exception", e);
    return trig.template;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
