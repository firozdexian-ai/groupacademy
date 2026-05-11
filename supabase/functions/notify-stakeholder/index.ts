// notify-stakeholder: Smart routing dispatcher.
// Inputs: { agent_key?: string, audience_type: 'admin'|'talent'|'business'|'system',
//           event_topic: string, message: string, title?: string, metadata?: object }
//
// Resolves matching rules from `workforce_routing_rules`, then sends through the
// per-agent credentials in `workforce_channel_connections` (falling back to the
// global TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID for system alerts).
//
// Channels supported now: telegram. WhatsApp / Email are logged as TODO so the
// dispatcher returns the full plan without failing — easy to extend later.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GLOBAL_TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const GLOBAL_TG_CHAT  = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") ?? "";

const ALLOWED_AUDIENCES = new Set(["admin", "talent", "business", "system"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: accept any signed-in user — caller is usually agent-tool-execute
    // forwarding the original JWT, OR admin-agent-tools after RBAC check.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ ok: false, error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: auth } = await userClient.auth.getUser();
    if (!auth?.user) return j({ ok: false, error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const agentKey      = (body.agent_key ?? null) as string | null;
    const audienceType  = String(body.audience_type ?? "").trim();
    const eventTopic    = String(body.event_topic ?? "").trim();
    const message       = String(body.message ?? "").trim();
    const title         = body.title ? String(body.title) : null;
    const metadata      = (body.metadata && typeof body.metadata === "object") ? body.metadata : {};

    if (!ALLOWED_AUDIENCES.has(audienceType)) {
      return j({ ok: false, error: "invalid_audience_type" }, 400);
    }
    if (!eventTopic)             return j({ ok: false, error: "event_topic_required" }, 400);
    if (!message)                return j({ ok: false, error: "message_required" }, 400);
    if (message.length > 4000)   return j({ ok: false, error: "message_too_long" }, 400);

    // -------- Resolve matching routing rules --------
    // Match: (agent_key = X OR agent_key IS NULL) AND
    //        (event_topic = T OR event_topic = '*') AND
    //        (audience_type = A OR audience_type IS NULL)
    let query = admin
      .from("workforce_routing_rules")
      .select("id, agent_key, event_topic, channel_provider, destination_id, audience_type, description")
      .eq("is_active", true)
      .or(`event_topic.eq.${eventTopic},event_topic.eq.*`)
      .or(`audience_type.eq.${audienceType},audience_type.is.null`);

    if (agentKey) {
      query = query.or(`agent_key.eq.${agentKey},agent_key.is.null`);
    } else {
      query = query.is("agent_key", null);
    }

    const { data: rules, error: rulesErr } = await query;
    if (rulesErr) return j({ ok: false, error: `rules_lookup_failed:${rulesErr.message}` }, 500);

    const matched = rules ?? [];
    if (matched.length === 0) {
      console.log(`[notify-stakeholder] no rules matched`, { agentKey, audienceType, eventTopic });
      return j({ ok: true, dispatched: 0, matched: 0, fallback_used: false });
    }

    // -------- Dispatch each matched rule --------
    const dispatchResults: Array<Record<string, unknown>> = [];
    let fallbackUsed = false;

    for (const rule of matched) {
      const provider = String(rule.channel_provider);
      const destId   = String(rule.destination_id);

      // Lookup credentials: prefer rule.agent_key, fall back to incoming agent_key.
      const credAgent = (rule.agent_key as string | null) ?? agentKey;
      let credentials: Record<string, any> = {};
      if (credAgent) {
        const { data: conn } = await admin
          .from("workforce_channel_connections")
          .select("credentials")
          .eq("agent_key", credAgent)
          .eq("channel_provider", provider)
          .eq("is_active", true)
          .maybeSingle();
        if (conn?.credentials && typeof conn.credentials === "object") {
          credentials = conn.credentials as Record<string, any>;
        }
      }

      try {
        if (provider === "telegram") {
          let botToken = String(credentials.bot_token ?? credentials.token ?? "");
          if (!botToken) {
            botToken = GLOBAL_TG_TOKEN;
            fallbackUsed = !!botToken;
          }
          if (!botToken) {
            dispatchResults.push({ rule_id: rule.id, provider, ok: false, error: "no_telegram_token" });
            continue;
          }
          const chatId = destId || GLOBAL_TG_CHAT;
          const text = (title ? `*${title}*\n` : "") +
                       `${message}\n\n_topic: ${eventTopic} · audience: ${audienceType}_`;
          const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            }),
          });
          dispatchResults.push({
            rule_id: rule.id, provider, destination: chatId, ok: r.ok, status: r.status,
          });
          if (!r.ok) console.error("[notify-stakeholder] telegram non-2xx", r.status, await r.text());
        } else if (provider === "whatsapp" || provider === "email" || provider === "linkedin" || provider === "instagram" || provider === "web_widget") {
          // TODO: wire real providers — log and continue so the dispatcher
          // returns a complete plan.
          console.log(`[notify-stakeholder] TODO provider=${provider} dest=${destId} agent=${credAgent}`);
          dispatchResults.push({ rule_id: rule.id, provider, destination: destId, ok: true, deferred: true });
        } else {
          dispatchResults.push({ rule_id: rule.id, provider, ok: false, error: "unsupported_provider" });
        }
      } catch (e) {
        console.error("[notify-stakeholder] dispatch error", e);
        dispatchResults.push({ rule_id: rule.id, provider, ok: false, error: String(e) });
      }
    }

    // Telemetry — fire and forget
    admin.from("notification_dispatch_log").insert({
      agent_key: agentKey,
      audience_type: audienceType,
      event_topic: eventTopic,
      title,
      message,
      metadata,
      matched_rules: matched.length,
      dispatched: dispatchResults.length,
      results: dispatchResults,
      fallback_used: fallbackUsed,
    }).then(() => {}, (e: any) => console.log("[notify-stakeholder] log skipped:", e?.message));

    return j({
      ok: true,
      matched: matched.length,
      dispatched: dispatchResults.length,
      fallback_used: fallbackUsed,
      results: dispatchResults,
    });
  } catch (e) {
    console.error("[notify-stakeholder] fault:", e);
    return j({ ok: false, error: String(e) }, 500);
  }
});

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
