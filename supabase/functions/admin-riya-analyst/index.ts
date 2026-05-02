// Admin Riya Analyst — chat with the B2B onboarding agent's data.
// Super-admin only. Tools resolve against riya_conversations + companies.
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
      name: "riya_count",
      description:
        "Count Riya B2B onboarding conversations. status ∈ {all, completed, abandoned, in_progress}. since is ISO date (optional).",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["all", "completed", "abandoned", "in_progress"] },
          since: { type: "string" },
        },
        required: ["status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "riya_recent",
      description: "Recent Riya conversations. limit defaults to 10.",
      parameters: {
        type: "object",
        properties: { status: { type: "string" }, limit: { type: "integer" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "riya_drop_off",
      description: "Distribution of last_step values for ABANDONED B2B conversations.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "companies_signed_up",
      description: "Count companies created in a period. since is ISO date (optional).",
      parameters: { type: "object", properties: { since: { type: "string" } } },
    },
  },
];

const SYSTEM = `You are Riya's operator console for the GroUp Academy / Gro10x super admin.
Riya is the B2B onboarding gatekeeper that talks to every new company visitor.
Always CALL TOOLS for any number; never invent stats. Be concise. Use markdown.
Today: ${new Date().toISOString().slice(0, 10)}.`;

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
      .from("user_roles").select("role").eq("user_id", userData.user.id);
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
      const msg = data.choices?.[0]?.message;
      if (!msg) return json({ error: "no message" }, 500);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        convo.push(msg);
        for (const tc of msg.tool_calls) {
          const args = safeParse(tc.function?.arguments);
          let toolResult: any = { error: "unknown tool" };
          try { toolResult = await runTool(admin, tc.function.name, args); }
          catch (e) { toolResult = { error: String(e) }; }
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
    return json({ content: "Reached tool-call limit." });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }

  function json(o: unknown, status = 200) {
    return new Response(JSON.stringify(o), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  function safeParse(s: string | undefined) {
    if (!s) return {};
    try { return JSON.parse(s); } catch { return {}; }
  }
});

async function runTool(admin: any, name: string, args: any) {
  switch (name) {
    case "riya_count": {
      let q = admin.from("riya_conversations").select("id", { head: true, count: "exact" });
      if (args.status === "completed") q = q.not("completed_at", "is", null);
      else if (args.status === "abandoned") {
        q = q.is("completed_at", null).lt("updated_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());
      } else if (args.status === "in_progress") {
        q = q.is("completed_at", null).gte("updated_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());
      }
      if (args.since) q = q.gte("created_at", args.since);
      const { count } = await q;
      return { count: count ?? 0, status: args.status, since: args.since ?? null };
    }
    case "riya_recent": {
      const limit = Math.min(50, Math.max(1, args.limit ?? 10));
      let q = admin.from("riya_conversations")
        .select("session_id, last_step, completed_at, created_at, updated_at")
        .order("updated_at", { ascending: false }).limit(limit);
      if (args.status === "completed") q = q.not("completed_at", "is", null);
      if (args.status === "abandoned") q = q.is("completed_at", null);
      const { data } = await q;
      return { rows: data ?? [] };
    }
    case "riya_drop_off": {
      const { data } = await admin.from("riya_conversations")
        .select("last_step").is("completed_at", null).limit(2000);
      const buckets: Record<string, number> = {};
      for (const r of data ?? []) {
        const k = r.last_step ?? "unknown";
        buckets[k] = (buckets[k] ?? 0) + 1;
      }
      return { distribution: buckets };
    }
    case "companies_signed_up": {
      let q = admin.from("companies").select("id", { head: true, count: "exact" });
      if (args.since) q = q.gte("created_at", args.since);
      const { count } = await q;
      return { count: count ?? 0, since: args.since ?? null };
    }
    default: return { error: `unknown tool: ${name}` };
  }
}
