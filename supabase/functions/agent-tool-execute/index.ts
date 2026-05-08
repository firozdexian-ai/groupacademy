// agent-tool-execute: central dispatcher that lets agents call registered tools.
// Validates JWT, looks up the tool by tool_key, validates input against the
// stored JSON schema (required + enum + type), and invokes either an RPC or
// another edge function. Logs the call for telemetry.
//
// Request:  { agent_key: string, tool_key: string, input: object, thread_id?: string }
// Response: { ok: boolean, result?: any, error?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ ok: false, error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const agentKey = String(body.agent_key ?? "").trim();
    const toolKey = String(body.tool_key ?? "").trim();
    const input = (body.input && typeof body.input === "object") ? body.input : {};
    if (!agentKey || !toolKey) {
      return json({ ok: false, error: "agent_key_and_tool_key_required" }, 400);
    }

    // Lookup agent + tool + binding in one round-trip
    const [{ data: agent }, { data: tool }] = await Promise.all([
      admin.from("ai_agents")
        .select("id, agent_key, is_active, kill_switch")
        .eq("agent_key", agentKey).maybeSingle(),
      admin.from("agent_tools")
        .select("id, tool_key, handler_kind, handler_ref, input_schema, is_active, status")
        .eq("tool_key", toolKey).maybeSingle(),
    ]);

    if (!agent) return json({ ok: false, error: "agent_not_found" }, 404);
    if (!agent.is_active || agent.kill_switch) return json({ ok: false, error: "agent_disabled" }, 403);
    if (!tool || !tool.is_active || tool.status !== "available") {
      return json({ ok: false, error: "tool_unavailable" }, 404);
    }

    const { data: binding } = await admin
      .from("agent_tool_bindings")
      .select("id")
      .eq("agent_id", agent.id)
      .eq("tool_id", tool.id)
      .maybeSingle();
    if (!binding) return json({ ok: false, error: "tool_not_bound_to_agent" }, 403);

    // ---------- JSON-schema validation (required + type + enum) ----------
    const schema = (tool.input_schema ?? {}) as any;
    const validation = validate(input, schema);
    if (!validation.ok) return json({ ok: false, error: `invalid_input:${validation.error}` }, 400);

    // ---------- Dispatch ----------
    let result: any;
    if (tool.handler_kind === "rpc") {
      const fn = String(tool.handler_ref || tool.tool_key);
      const args = mapInputToRpcArgs(fn, input);
      const { data, error } = await userClient.rpc(fn as any, args);
      if (error) return json({ ok: false, error: error.message }, 400);
      result = data;
    } else if (tool.handler_kind === "edge_function") {
      const fnName = String(tool.handler_ref || tool.tool_key);
      const r = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          apikey: ANON_KEY,
        },
        body: JSON.stringify(input),
      });
      const text = await r.text();
      try { result = JSON.parse(text); } catch { result = { raw: text }; }
      if (!r.ok) return json({ ok: false, error: `edge_${r.status}`, result }, 400);
    } else {
      return json({ ok: false, error: `unsupported_handler:${tool.handler_kind}` }, 400);
    }

    // Telemetry — fire and forget
    admin.from("agent_credit_events").insert({
      agent_id: agent.id,
      subject_kind: "talent",
      subject_id: null,
      event_kind: "tool_call",
      credits: 0,
      thread_id: body.thread_id ?? null,
    }).then(() => {}, () => {});

    return json({ ok: true, result }, 200);
  } catch (e) {
    console.error("[agent-tool-execute] fault:", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

// ---------- helpers ----------
function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Map sanitized JSON input → RPC argument names (p_<key>) used by our SECURITY DEFINER fns.
function mapInputToRpcArgs(_fn: string, input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) out[`p_${k}`] = v;
  return out;
}

// Minimal JSON-schema validator — covers what we register: required, type, enum, minimum, minItems.
function validate(input: any, schema: any): { ok: true } | { ok: false; error: string } {
  if (!schema || typeof schema !== "object") return { ok: true };
  if (schema.type === "object") {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return { ok: false, error: "expected_object" };
    }
    const required: string[] = Array.isArray(schema.required) ? schema.required : [];
    for (const r of required) {
      if (input[r] === undefined || input[r] === null || input[r] === "") {
        return { ok: false, error: `missing:${r}` };
      }
    }
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(input)) {
      const ps = props[k];
      if (!ps) continue;
      const sub = validate(v, ps);
      if (!sub.ok) return { ok: false, error: `${k}.${(sub as any).error}` };
    }
    return { ok: true };
  }
  if (schema.type === "array") {
    if (!Array.isArray(input)) return { ok: false, error: "expected_array" };
    if (typeof schema.minItems === "number" && input.length < schema.minItems) {
      return { ok: false, error: `min_items:${schema.minItems}` };
    }
    if (schema.items) {
      for (const item of input) {
        const sub = validate(item, schema.items);
        if (!sub.ok) return sub;
      }
    }
    return { ok: true };
  }
  if (schema.type === "string") {
    if (typeof input !== "string") return { ok: false, error: "expected_string" };
    if (Array.isArray(schema.enum) && !schema.enum.includes(input)) {
      return { ok: false, error: `not_in_enum` };
    }
    return { ok: true };
  }
  if (schema.type === "number") {
    if (typeof input !== "number") return { ok: false, error: "expected_number" };
    if (typeof schema.minimum === "number" && input < schema.minimum) {
      return { ok: false, error: `below_min:${schema.minimum}` };
    }
    return { ok: true };
  }
  return { ok: true };
}
