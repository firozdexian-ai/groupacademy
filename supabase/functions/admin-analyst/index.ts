// Admin Business Analyst — streaming chat with whitelisted DB tools.
// Super-admin only. Uses Lovable AI Gateway with tool calling.
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
      name: "analyst_metric",
      description:
        "Get a single metric value over a period. metric ∈ {talents_count, transactions_count, transactions_revenue_bdt, jobs_count, job_applications_count, companies_count, enrollments_count, agent_sessions_count, credits_issued, credits_spent}. period = {from?: ISO, to?: ISO}.",
      parameters: {
        type: "object",
        properties: {
          metric: { type: "string" },
          period: {
            type: "object",
            properties: { from: { type: "string" }, to: { type: "string" } },
          },
        },
        required: ["metric"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyst_top_n",
      description:
        "Top-N grouping. Supported (dimension, metric): (country, talents_count), (country, jobs_count), (company, jobs_count), (service, transactions_revenue_bdt).",
      parameters: {
        type: "object",
        properties: {
          dimension: { type: "string" },
          metric: { type: "string" },
          period: { type: "object" },
          n: { type: "integer" },
        },
        required: ["dimension", "metric"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyst_series",
      description:
        "Time series for metric ∈ {talents_count, transactions_count, transactions_revenue_bdt, jobs_count}. granularity ∈ {day, week, month}.",
      parameters: {
        type: "object",
        properties: {
          metric: { type: "string" },
          period: { type: "object" },
          granularity: { type: "string" },
        },
        required: ["metric"],
      },
    },
  },
];

const SYSTEM = `You are the Business Analyst agent for an internal admin panel.
You answer the operator's questions about the platform by CALLING TOOLS — never invent numbers.
Always pick a sensible time period (today, this week, this month, this quarter, lifetime) from the user's words.
Return concise, scannable answers with bold numbers and short bullet lists. Use markdown tables for multi-row results.
Today's date: ${new Date().toISOString().slice(0, 10)}.`;

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
    const isSuper = (roleRows ?? []).some((r) => r.role === "super_admin");
    if (!isSuper) return json({ error: "forbidden" }, 403);

    const body = await req.json();
    const messages = body.messages ?? [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    // Tool-call loop. We resolve tools server-side then re-prompt the model.
    const convo: any[] = [{ role: "system", content: SYSTEM }, ...messages];

    for (let step = 0; step < 5; step++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: convo,
          tools: TOOLS,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return json({ error: "AI gateway error", detail: t, status: r.status }, r.status);
      }
      const data = await r.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) return json({ error: "no message" }, 500);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        convo.push(msg);
        for (const tc of msg.tool_calls) {
          const args = safeParse(tc.function?.arguments);
          let toolResult: any = { error: "unknown tool" };
          try {
            // Use a user-scoped client so the SECURITY DEFINER function still
            // sees auth.uid() for its has_role check.
            const { data: rpcData, error } = await userClient.rpc(
              tc.function.name as any,
              args,
            );
            toolResult = error ? { error: error.message } : rpcData;
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
