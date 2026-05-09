// admin-agents-router — Phase A3 Swarm Bridge.
// Loads the requested admin agent, dynamically materializes its tools from
// agent_tools / agent_tool_bindings, exposes them to the LLM via OpenAI-style
// tool calling, validates input, and dispatches each invocation through the
// existing `agent-tool-execute` edge function. Falls back to a vanilla chat
// reply when the model produces no tool call.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const MAX_TOOL_HOPS = 4;

// Map tool_key → React Query keys to invalidate on the admin client after a
// successful mutation. The frontend (`useAdminChatThread`) reads the response
// `invalidate` array and calls `queryClient.invalidateQueries` for each.
const TOOL_INVALIDATIONS_ADMIN: Record<string, string[]> = {
  approve_payout: ["admin-payout-requests", "instructor-payouts", "admin-credit-invoices"],
  reject_payout: ["admin-payout-requests", "instructor-payouts"],
  force_run_matchmaker: ["admin-gigs", "admin-marketplace-gigs", "admin-marketplace-bids"],
  award_credits: ["admin-credit-invoices", "talent-credits", "admin-talents"],
  archive_expired_jobs: ["admin-jobs", "jobs-hub-dashboard", "admin-jobs-list"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "unauthorized" }, 401);

    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("talent_exec")) {
      return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const agentKey = String(body.agent_key ?? "").trim();
    const message = String(body.message ?? "").trim();
    const history = Array.isArray(body.history) ? body.history : [];
    if (!agentKey || !message) return json({ error: "agent_key_and_message_required" }, 400);

    if (!LOVABLE_API_KEY) return json({ error: "ai_gateway_not_configured" }, 500);

    // 1) Resolve the agent persona
    const { data: agent, error: agentErr } = await admin
      .from("ai_agents")
      .select("id, name, agent_key, system_prompt, model_preference, is_active, kill_switch")
      .eq("agent_key", agentKey)
      .maybeSingle();
    if (agentErr || !agent) return json({ error: `agent_not_found:${agentKey}` }, 404);
    if (!agent.is_active || agent.kill_switch) {
      return json({ error: "agent_disabled" }, 403);
    }

    // 2) Materialize bound tools dynamically
    const { data: bindings } = await admin
      .from("agent_tool_bindings")
      .select("tool_id, agent_tools:tool_id(id, tool_key, name, description, input_schema, is_active, status)")
      .eq("agent_id", agent.id);

    const tools: any[] = [];
    const toolByName = new Map<string, { tool_key: string; schema: any }>();
    for (const b of bindings ?? []) {
      const t: any = (b as any).agent_tools;
      if (!t || !t.is_active || t.status !== "available") continue;
      const safeName = String(t.tool_key).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
      const schema = (t.input_schema && typeof t.input_schema === "object" && (t.input_schema as any).type)
        ? t.input_schema
        : { type: "object", properties: {}, additionalProperties: true };
      tools.push({
        type: "function",
        function: {
          name: safeName,
          description: t.description || t.name || t.tool_key,
          parameters: schema,
        },
      });
      toolByName.set(safeName, { tool_key: t.tool_key, schema });
    }

    const toolHint = tools.length
      ? `\n\nYou have ${tools.length} tools available. Call a tool when the user is asking you to perform a write action (award credits, apply to a job, save a job, pause a trigger, update a profile, etc.). For pure questions, answer directly.`
      : "";

    const systemPrompt =
      (agent.system_prompt ||
        `You are ${agent.name}, an internal admin assistant for GroUp Academy. Be concise, operational, and decisive.`) + toolHint;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const model = agent.model_preference || "google/gemini-2.5-flash";
    const toolInvocations: any[] = [];

    // 3) Tool-loop
    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          ...(tools.length ? { tools, tool_choice: "auto" } : {}),
        }),
      });

      if (!aiResp.ok) {
        const errBody = await aiResp.text();
        console.error("[admin-agents-router] gateway error:", aiResp.status, errBody);
        if (aiResp.status === 429) return json({ error: "rate_limited" }, 429);
        if (aiResp.status === 402) return json({ error: "ai_credits_exhausted" }, 402);
        return json({ error: "ai_gateway_error", detail: errBody.slice(0, 400) }, 500);
      }

      const aiData = await aiResp.json();
      const choice = aiData.choices?.[0];
      const msg = choice?.message ?? {};
      const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];

      // No tool call → final answer
      if (!calls.length) {
        const reply = msg.content ?? "(no answer)";
        // Telemetry session row (best-effort)
        admin.from("agent_chat_sessions").insert({
          user_id: user.id,
          agent_key: agentKey,
          prompt_tokens: aiData.usage?.prompt_tokens ?? 0,
          completion_tokens: aiData.usage?.completion_tokens ?? 0,
        }).then(() => {}, () => {});
        return json({ reply, tool_invocations: toolInvocations, invalidate: collectInvalidations(toolInvocations) }, 200);
      }

      // Push the assistant turn carrying the tool calls
      messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });

      // Execute each tool call by calling our central dispatcher
      for (const call of calls) {
        const fnName = call.function?.name;
        const argsRaw = call.function?.arguments ?? "{}";
        let parsed: any = {};
        try { parsed = JSON.parse(argsRaw); } catch { parsed = {}; }

        const meta = toolByName.get(fnName);
        if (!meta) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ ok: false, error: `unknown_tool:${fnName}` }),
          });
          toolInvocations.push({ tool: fnName, ok: false, error: "unknown_tool" });
          continue;
        }

        // Dispatch through the existing executor (handles JSON-schema validation + RPC/edge routing)
        const dispatch = await fetch(`${SUPABASE_URL}/functions/v1/agent-tool-execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            apikey: ANON_KEY,
          },
          body: JSON.stringify({
            agent_key: agentKey,
            tool_key: meta.tool_key,
            input: parsed,
          }),
        });
        const dispatchText = await dispatch.text();
        let dispatchJson: any;
        try { dispatchJson = JSON.parse(dispatchText); } catch { dispatchJson = { ok: false, raw: dispatchText }; }

        toolInvocations.push({ tool: meta.tool_key, ok: !!dispatchJson.ok, result: dispatchJson });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(dispatchJson).slice(0, 6000),
        });
      }
    }

    return json({
      reply: "I tried to use my tools but kept looping. Please rephrase or break the request into smaller steps.",
      tool_invocations: toolInvocations,
      invalidate: collectInvalidations(toolInvocations),
    }, 200);
  } catch (e: any) {
    console.error("[admin-agents-router] fault:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function collectInvalidations(invs: any[]): string[] {
  const out = new Set<string>();
  for (const inv of invs ?? []) {
    if (!inv?.ok) continue;
    const keys = TOOL_INVALIDATIONS_ADMIN[inv.tool] ?? [];
    keys.forEach((k) => out.add(k));
  }
  return Array.from(out);
}

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
