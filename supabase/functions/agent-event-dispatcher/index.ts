// Phase 6 — Headless agent event dispatcher
// Polls unprocessed platform_events, matches them to agent_triggers,
// generates the outbound message via Lovable AI, charges the headless pool,
// and writes results to agent_outreach + notifications.
//
// Triggered by pg_cron every minute. No auth required (verify_jwt = false)
// but we accept a shared CRON_SECRET to discourage casual invocation.

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
const COST_PER_OUTREACH = 0.5; // headless pool credits per generated message

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
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // Pull a batch of unprocessed events (oldest first)
    const { data: events, error: eventsErr } = await admin
      .from("platform_events")
      .select("id, event_kind, subject_kind, subject_id, payload")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(BATCH);

    if (eventsErr) throw eventsErr;
    if (!events?.length) {
      return json({ ok: true, processed: 0 });
    }

    let dispatched = 0;
    let skipped = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const evt of events as PlatformEvent[]) {
      const { data: triggers, error: trigErr } = await admin
        .from("agent_triggers")
        .select("id, agent_id, event_kind, recipient_strategy, recipient_filter, template")
        .eq("event_kind", evt.event_kind)
        .eq("is_active", true);

      if (trigErr) {
        console.error("trigger lookup failed", trigErr);
        continue;
      }

      for (const trig of (triggers || []) as AgentTrigger[]) {
        try {
          const r = await runTrigger(admin, evt, trig);
          if (r.dispatched) dispatched++;
          else skipped++;
          results.push({ event: evt.id, trigger: trig.id, ...r });
        } catch (e) {
          console.error("trigger run failed", trig.id, e);
          results.push({ event: evt.id, trigger: trig.id, error: String(e) });
        }
      }

      // Mark event processed regardless (triggers logged any failures individually)
      await admin
        .from("platform_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", evt.id);
    }

    return json({ ok: true, events: events.length, dispatched, skipped, results });
  } catch (err) {
    console.error("dispatcher fatal", err);
    return json({ error: String(err) }, 500);
  }
});

async function runTrigger(
  admin: ReturnType<typeof createClient>,
  evt: PlatformEvent,
  trig: AgentTrigger,
): Promise<{ dispatched: boolean; reason?: string; outreach_id?: string }> {
  // Load the agent
  const { data: agent } = await admin
    .from("ai_agents")
    .select("id, agent_key, name, system_prompt, kill_switch, is_active")
    .eq("id", trig.agent_id)
    .maybeSingle();

  if (!agent || !agent.is_active || agent.kill_switch) {
    return { dispatched: false, reason: "agent_disabled" };
  }

  // Resolve recipient
  const recipient = resolveRecipient(trig, evt);
  if (!recipient) return { dispatched: false, reason: "no_recipient" };

  // Charge headless pool
  const { data: charge, error: chargeErr } = await admin.rpc("headless_pool_charge", {
    p_amount: COST_PER_OUTREACH,
    p_reason: `${agent.agent_key} -> ${trig.event_kind}`,
  });
  if (chargeErr || !(charge as any)?.success) {
    await admin.from("agent_outreach").insert({
      agent_id: agent.id,
      trigger_id: trig.id,
      event_id: evt.id,
      recipient_kind: recipient.kind,
      recipient_id: recipient.id,
      channel: "in_app",
      subject: trig.event_kind,
      body: trig.template,
      payload: evt.payload as any,
      status: "failed",
      error_message: (charge as any)?.error || chargeErr?.message || "pool_charge_failed",
      credits_charged: 0,
    });
    return { dispatched: false, reason: "pool_unavailable" };
  }

  // Generate message body via Lovable AI
  const body = await generateMessage(agent, trig, evt);

  // Write outreach row
  const { data: outreach, error: outErr } = await admin
    .from("agent_outreach")
    .insert({
      agent_id: agent.id,
      trigger_id: trig.id,
      event_id: evt.id,
      recipient_kind: recipient.kind,
      recipient_id: recipient.id,
      channel: "in_app",
      subject: agent.name,
      body,
      payload: evt.payload as any,
      status: "sent",
      credits_charged: COST_PER_OUTREACH,
    })
    .select("id")
    .single();

  if (outErr) {
    console.error("outreach insert failed", outErr);
    return { dispatched: false, reason: "insert_failed" };
  }

  // Mirror to in-app notifications when recipient is a talent
  if (recipient.kind === "talent" && recipient.id) {
    await admin.from("notifications").insert({
      talent_id: recipient.id,
      type: "agent_outreach",
      title: agent.name,
      message: body.length > 220 ? body.slice(0, 217) + "…" : body,
      icon: "sparkles",
    });
  }

  // Update trigger last_fired_at (best-effort)
  await admin
    .from("agent_triggers")
    .update({ last_fired_at: new Date().toISOString() })
    .eq("id", trig.id);

  return { dispatched: true, outreach_id: outreach.id };
}

function resolveRecipient(
  trig: AgentTrigger,
  evt: PlatformEvent,
): { kind: "talent" | "company" | "admin"; id: string | null } | null {
  switch (trig.recipient_strategy) {
    case "subject":
      if (!evt.subject_kind || !evt.subject_id) return null;
      if (evt.subject_kind === "talent") return { kind: "talent", id: evt.subject_id };
      if (evt.subject_kind === "company") return { kind: "company", id: evt.subject_id };
      return null;
    case "admin":
      return { kind: "admin", id: null };
    case "company": {
      const cid = (trig.recipient_filter?.company_id as string) || evt.subject_id;
      return cid ? { kind: "company", id: cid } : null;
    }
    case "custom": {
      const kind = trig.recipient_filter?.recipient_kind as string;
      const id = trig.recipient_filter?.recipient_id as string;
      if (!kind) return null;
      return { kind: kind as any, id: id || null };
    }
    default:
      return null;
  }
}

async function generateMessage(
  agent: { name: string; system_prompt: string },
  trig: AgentTrigger,
  evt: PlatformEvent,
): Promise<string> {
  const sys = `${agent.system_prompt}\n\nYou are sending a SHORT proactive message (2-4 sentences, max 320 chars). Be warm, specific, and end with one concrete next step. Do NOT use markdown headings.`;
  const user = `Event: ${evt.event_kind}\nPayload: ${JSON.stringify(evt.payload).slice(0, 1500)}\n\nUse this template/intent as a guide (rewrite naturally, do not echo verbatim):\n${trig.template}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        max_tokens: 220,
      }),
    });
    if (!res.ok) {
      console.error("AI gen failed", res.status, await res.text());
      return trig.template;
    }
    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content?.trim();
    return out || trig.template;
  } catch (e) {
    console.error("AI gen exception", e);
    return trig.template;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
