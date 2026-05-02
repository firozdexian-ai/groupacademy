// Admin Agent Manager — chat with the entire AI Agent OS.
// Admin/super_admin only. Reports on agents, tools, channels, sessions, credits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "agents_list",
      description:
        "List agents grouped by agent_type. Filter by type (b2c|b2b|platform_tool|ugc|marketplace) or audience.",
      parameters: {
        type: "object",
        properties: {
          agent_type: { type: "string" },
          audience: { type: "string" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agents_count_by_type",
      description: "Count agents grouped by agent_type and visibility.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "agent_runs",
      description:
        "Number of agent_chat_sessions in the last N days. Optional agent_key filter.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer" },
          agent_key: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agent_credits_earned",
      description:
        "Sum of credits attributed to agents (from agent_credit_events) in the last N days.",
      parameters: {
        type: "object",
        properties: { days: { type: "integer" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tools_registry",
      description:
        "List entries in agent_tools, optionally filtered by handler_kind (edge_function|connector|skill|rpc|internal).",
      parameters: {
        type: "object",
        properties: { handler_kind: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "channels_registry",
      description: "List configured agent_channels.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const SYSTEM = `You are the Agent Manager — operator console for the entire AI Agent OS at GroUp Academy.
Answer the admin's questions about all agents (B2C, B2B, platform tools, user-generated, marketplace) by CALLING TOOLS — never invent numbers.
Be concise. Use markdown. Bold the key numbers. Today: ${new Date().toISOString().slice(0, 10)}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);

    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(SUPA_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPA_URL, SERVICE_KEY);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("super_admin") && !roles.includes("admin")) {
      return json({ error: "forbidden" }, 403);
    }

    const body = await req.json();
    const messages = body.messages ?? [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const convo: any[] = [{ role: "system", content: SYSTEM }, ...messages];

    for (let step = 0; step < 5; step++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: convo,
          tools: TOOLS,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return json({ error: "AI gateway error", detail: t, status: r.status }, r.status);
      }
      const data = await r.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) return json({ error: "no message" }, 500);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        convo.push(msg);
        for (const tc of msg.tool_calls) {
          const args = safeParse(tc.function?.arguments);
          let toolResult: any = { error: "unknown tool" };
          try {
            toolResult = await runTool(admin, tc.function.name, args);
          } catch (e) {
            toolResult = { error: String(e) };
          }
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(toolResult),
          });
        }
        continue;
      }

      return json({ content: msg.content ?? "" });
    }
    return json({ content: "I couldn't complete the analysis after several tool calls." });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }

  function json(o: unknown, status = 200) {
    return new Response(JSON.stringify(o), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  function safeParse(s: string | undefined) {
    if (!s) return {};
    try { return JSON.parse(s); } catch { return {}; }
  }
});

async function runTool(admin: any, name: string, args: any) {
  switch (name) {
    case "agents_list": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 25));
      let q = admin
        .from("ai_agents")
        .select("agent_key,name,agent_type,audience,visibility,is_active,total_conversations")
        .order("total_conversations", { ascending: false })
        .limit(limit);
      if (args.agent_type) q = q.eq("agent_type", args.agent_type);
      if (args.audience) q = q.eq("audience", args.audience);
      const { data } = await q;
      return { rows: data ?? [] };
    }
    case "agents_count_by_type": {
      const { data } = await admin
        .from("ai_agents")
        .select("agent_type,visibility,is_active")
        .limit(2000);
      const byType: Record<string, number> = {};
      const byVis: Record<string, number> = {};
      let active = 0;
      for (const r of data ?? []) {
        byType[r.agent_type ?? "unknown"] = (byType[r.agent_type ?? "unknown"] ?? 0) + 1;
        byVis[r.visibility ?? "unknown"] = (byVis[r.visibility ?? "unknown"] ?? 0) + 1;
        if (r.is_active) active++;
      }
      return { total: (data ?? []).length, active, by_type: byType, by_visibility: byVis };
    }
    case "agent_runs": {
      const days = Math.max(1, args.days ?? 7);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      let q = admin.from("agent_chat_sessions").select("id", { head: true, count: "exact" }).gte("created_at", since);
      if (args.agent_key) q = q.eq("agent_key", args.agent_key);
      const { count } = await q;
      return { count: count ?? 0, days };
    }
    case "agent_credits_earned": {
      const days = Math.max(1, args.days ?? 30);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data } = await admin
        .from("agent_credit_events")
        .select("credits")
        .gte("created_at", since)
        .limit(5000);
      const total = (data ?? []).reduce((a: number, r: any) => a + Number(r.credits ?? 0), 0);
      return { total_credits: total, days };
    }
    case "tools_registry": {
      let q = admin
        .from("agent_tools")
        .select("tool_key,name,handler_kind,category,connector_id,status,is_active")
        .order("handler_kind");
      if (args.handler_kind) q = q.eq("handler_kind", args.handler_kind);
      const { data } = await q;
      return { rows: data ?? [] };
    }
    case "channels_registry": {
      const { data } = await admin
        .from("agent_channels")
        .select("channel_key,label,direction,is_active");
      return { rows: data ?? [] };
    }
    default:
      return { error: `unknown tool: ${name}` };
  }
}
