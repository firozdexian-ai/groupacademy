import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * GroUp Academy: Neural Agent Orchestrator (V3.0 — Toolified)
 * Phase T1: Dynamic tool resolution + max-4-hop tool loop + context injection.
 * Streams final assistant reply (SSE) after all tool hops resolve.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GENERIC_FALLBACK = `You are a helpful assistant at GroUp Academy. Keep responses concise and supportive.`;
const MAX_TOOL_HOPS = 4;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const agentKey = String(body.agentKey ?? "").trim();
    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
    const ctx = (body.context && typeof body.context === "object") ? body.context : {};
    if (!agentKey) return new Response("agentKey required", { status: 400, headers: corsHeaders });

    // PHASE 1: Resolve agent
    const { data: agentConfig } = await admin
      .from("ai_agents")
      .select("id, system_prompt, name, is_active, kill_switch")
      .eq("agent_key", agentKey)
      .maybeSingle();

    if (agentConfig?.kill_switch) {
      return new Response(JSON.stringify({ error: "agent_disabled" }), { status: 403, headers: corsHeaders });
    }

    let systemPrompt = agentConfig?.system_prompt || GENERIC_FALLBACK;

    // PHASE 2: Talent context (cure AI amnesia)
    const { data: talent } = await admin
      .from("talents")
      .select("id, full_name, custom_profession, profession, experience_years, skills, current_status, country")
      .eq("user_id", user.id)
      .maybeSingle();

    if (talent) {
      const skillsList = Array.isArray(talent.skills) ? talent.skills.join(", ") : "Not provided";
      const profession = talent.profession || talent.custom_profession || "Student/Professional";
      systemPrompt += `
---
INTERNAL SYSTEM DIRECTIVE - USER CONTEXT:
You are speaking with ${talent.full_name || "a user"}.
Location: ${talent.country || "Unknown"}
Profession: ${profession}
Years of Experience: ${talent.experience_years || 0}
Skills: ${skillsList}
Current Status: ${talent.current_status || "Not provided"}
CRITICAL RULE: Use this context to personalize advice. Do not re-ask known facts.
---`;
    }

    // PHASE 3: Page context injection (job_id / gig_id / course_id)
    const ctxLines: string[] = [];
    if (ctx.job_id) ctxLines.push(`current_job_id: ${ctx.job_id}`);
    if (ctx.gig_id) ctxLines.push(`current_gig_id: ${ctx.gig_id} (kind: ${ctx.gig_kind || "marketplace"})`);
    if (ctx.course_id) ctxLines.push(`current_course_id: ${ctx.course_id}`);
    if (ctx.module_id) ctxLines.push(`current_module_id: ${ctx.module_id}`);
    if (ctxLines.length > 0) {
      systemPrompt += `\n---\nPAGE CONTEXT (the user is currently looking at):\n${ctxLines.join("\n")}\nUse these IDs when calling tools that require them. Do not ask the user for IDs already in context.\n---`;
    }

    // PHASE 4: Resolve bound tools
    let tools: any[] = [];
    let toolMap: Record<string, { tool_key: string; handler_kind: string }> = {};
    if (agentConfig?.id) {
      const { data: bindings } = await admin
        .from("agent_tool_bindings")
        .select("tool_id, agent_tools!inner(id, tool_key, description, input_schema, is_active, status)")
        .eq("agent_id", agentConfig.id);

      for (const row of (bindings ?? []) as any[]) {
        const t = row.agent_tools;
        if (!t || !t.is_active || t.status !== "available") continue;
        // OpenAI function schema. Names must match `^[a-zA-Z0-9_-]+$`
        const fnName = String(t.tool_key).replace(/[^a-zA-Z0-9_-]/g, "_");
        toolMap[fnName] = { tool_key: t.tool_key, handler_kind: "" };
        tools.push({
          type: "function",
          function: {
            name: fnName,
            description: t.description || `Execute ${t.tool_key}`,
            parameters: t.input_schema || { type: "object", properties: {} },
          },
        });
      }
    }

    // PHASE 5: Tool-calling loop (max 4 hops, non-stream) → final stream
    const convo: any[] = [{ role: "system", content: systemPrompt }, ...incomingMessages];
    let hops = 0;

    while (hops < MAX_TOOL_HOPS && tools.length > 0) {
      const hopRes = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: convo, tools, tool_choice: "auto", stream: false }),
      });

      if (!hopRes.ok) {
        const status = hopRes.status;
        if (status === 429 || status === 402) {
          return new Response(JSON.stringify({ error: "AI_QUOTA_EXCEEDED" }), { status, headers: corsHeaders });
        }
        const txt = await hopRes.text();
        console.error("[ai-agent-chat] hop fault", status, txt);
        break;
      }

      const hopJson = await hopRes.json();
      const choice = hopJson.choices?.[0];
      const msg = choice?.message;
      const toolCalls = msg?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls — break and stream final response (replay convo)
        break;
      }

      // Append assistant tool-call message
      convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: toolCalls });

      // Execute each tool via central dispatcher
      for (const call of toolCalls) {
        const fnName = call.function?.name;
        const argsRaw = call.function?.arguments ?? "{}";
        let args: any = {};
        try { args = JSON.parse(argsRaw); } catch { args = {}; }
        const meta = toolMap[fnName];
        let toolResult: any;
        if (!meta) {
          toolResult = { ok: false, error: "tool_not_bound" };
        } else {
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/agent-tool-execute`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                apikey: SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ agent_key: agentKey, tool_key: meta.tool_key, input: args }),
            });
            const txt = await r.text();
            try { toolResult = JSON.parse(txt); } catch { toolResult = { ok: r.ok, raw: txt }; }
          } catch (e: any) {
            toolResult = { ok: false, error: String(e?.message || e) };
          }
        }
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolResult).slice(0, 8000),
        });
      }
      hops++;
    }

    // PHASE 6: Final streamed completion
    const finalRes = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: convo, stream: true }),
    });

    if (!finalRes.ok) {
      const status = finalRes.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: "AI_QUOTA_EXCEEDED" }), { status, headers: corsHeaders });
      }
      throw new Error("AI_GATEWAY_FAULT");
    }

    return new Response(finalRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err: any) {
    console.error("[ai-agent-chat] AGENT_ORCHESTRATION_FAULT:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
