// Admin Report Builder — turns NL brief into a JSON report spec, then resolves
// every section via whitelisted analyst RPCs. Super-admin only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAN_TOOL = {
  type: "function",
  function: {
    name: "build_report",
    description: "Plan a visual report. Each section pulls from analyst RPCs.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        period: {
          type: "object",
          properties: { from: { type: "string" }, to: { type: "string" } },
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["kpi", "bar", "line", "pie", "note"] },
              title: { type: "string" },
              source: {
                type: "object",
                description: "Resolves to data. fn ∈ {metric, top_n, series}",
                properties: {
                  fn: { type: "string", enum: ["metric", "top_n", "series"] },
                  metric: { type: "string" },
                  dimension: { type: "string" },
                  granularity: { type: "string" },
                  n: { type: "integer" },
                },
                required: ["fn"],
              },
              note: { type: "string" },
            },
            required: ["kind", "title"],
          },
        },
      },
      required: ["title", "sections"],
    },
  },
};

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
    const { data: ud } = await userClient.auth.getUser(token);
    if (!ud?.user) return json({ error: "unauthorized" }, 401);
    const admin = createClient(SUPA_URL, SERVICE_KEY);
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", ud.user.id);
    if (!(roles ?? []).some((r) => r.role === "super_admin"))
      return json({ error: "forbidden" }, 403);

    const { brief } = await req.json();
    if (!brief || typeof brief !== "string") return json({ error: "brief required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You design crisp executive reports. Today: ${new Date().toISOString().slice(0,10)}.
Compose 3–6 sections. Use 'kpi' for headline numbers, 'line' for trends, 'bar' / 'pie' for comparisons.
Always include a 'period' (from/to ISO). Never invent data — every section must specify a 'source'.`,
          },
          { role: "user", content: brief },
        ],
        tools: [PLAN_TOOL],
        tool_choice: { type: "function", function: { name: "build_report" } },
      }),
    });
    if (!r.ok) return json({ error: "AI gateway error", detail: await r.text() }, r.status);
    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const spec = call ? JSON.parse(call.function.arguments) : null;
    if (!spec) return json({ error: "no spec" }, 500);

    // Resolve each section's data via the user-scoped client (RLS preserved).
    const resolved: Record<string, unknown> = {};
    for (let i = 0; i < (spec.sections ?? []).length; i++) {
      const s = spec.sections[i];
      const src = s.source;
      if (!src) continue;
      try {
        if (src.fn === "metric") {
          const { data: d } = await userClient.rpc("analyst_metric", {
            metric: src.metric, period: spec.period ?? {},
          });
          resolved[i] = d;
        } else if (src.fn === "top_n") {
          const { data: d } = await userClient.rpc("analyst_top_n", {
            dimension: src.dimension, metric: src.metric,
            period: spec.period ?? {}, n: src.n ?? 10,
          });
          resolved[i] = d;
        } else if (src.fn === "series") {
          const { data: d } = await userClient.rpc("analyst_series", {
            metric: src.metric, period: spec.period ?? {},
            granularity: src.granularity ?? "day",
          });
          resolved[i] = d;
        }
      } catch (e) {
        resolved[i] = { error: String(e) };
      }
    }

    return json({ spec, data: resolved });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
  function json(o: unknown, status = 200) {
    return new Response(JSON.stringify(o), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
