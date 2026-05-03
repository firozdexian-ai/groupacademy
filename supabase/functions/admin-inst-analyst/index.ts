// Admin Organizations Analyst — read-only insights across institutions, partner
// orgs, clubs, representatives, and events.
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
      name: "stakeholder_counts",
      description: "Counts of institutions, partner organizations, clubs, representatives, and events.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "institutions_by_type",
      description: "Breakdown of institutions grouped by type (university, college, school, etc.).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "upcoming_events",
      description: "Upcoming events and competitions in the next N days. days defaults to 30.",
      parameters: {
        type: "object",
        properties: { days: { type: "integer" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "top_institutions_by_reps",
      description: "Top institutions ranked by number of representatives. limit defaults to 5.",
      parameters: {
        type: "object",
        properties: { limit: { type: "integer" } },
      },
    },
  },
];

const SYSTEM = `You are the Organizations Analyst for GroUp Academy super admin.
Your job is to answer questions about institutions, partner organizations, clubs,
representatives, and events. Always CALL TOOLS for any number; never invent stats.
Be concise. Use markdown. Today: ${new Date().toISOString().slice(0, 10)}.`;

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

    const fullMessages = [{ role: "system", content: SYSTEM }, ...messages];

    for (let step = 0; step < 5; step++) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: fullMessages,
          tools: TOOLS,
        }),
      });
      if (!aiRes.ok) {
        const text = await aiRes.text();
        return json({ error: "ai_error", detail: text }, 500);
      }
      const ai = await aiRes.json();
      const choice = ai.choices?.[0]?.message;
      fullMessages.push(choice);

      const calls = choice?.tool_calls ?? [];
      if (!calls.length) {
        return json({ message: choice?.content ?? "" });
      }
      for (const call of calls) {
        const result = await runTool(admin, call.function.name, JSON.parse(call.function.arguments || "{}"));
        fullMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }
    return json({ message: "Sorry, I could not complete that request." });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

async function runTool(admin: any, name: string, args: any) {
  if (name === "stakeholder_counts") {
    const [insts, partners, clubs, reps, events] = await Promise.all([
      admin.from("institutions").select("id", { count: "exact", head: true }),
      admin.from("partner_organizations").select("id", { count: "exact", head: true }),
      admin.from("institution_clubs").select("id", { count: "exact", head: true }),
      admin.from("institution_representatives").select("id", { count: "exact", head: true }),
      admin.from("institution_events").select("id", { count: "exact", head: true }),
    ]);
    return {
      institutions: insts.count ?? 0,
      partner_organizations: partners.count ?? 0,
      clubs: clubs.count ?? 0,
      representatives: reps.count ?? 0,
      events: events.count ?? 0,
    };
  }
  if (name === "institutions_by_type") {
    const { data } = await admin.from("institutions").select("type");
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      counts[r.type ?? "unknown"] = (counts[r.type ?? "unknown"] ?? 0) + 1;
    });
    return counts;
  }
  if (name === "upcoming_events") {
    const days = args.days ?? 30;
    const until = new Date(Date.now() + days * 86400000).toISOString();
    const { data } = await admin
      .from("institution_events")
      .select("title,type,starts_at,location,status,institution_id")
      .gte("starts_at", new Date().toISOString())
      .lte("starts_at", until)
      .order("starts_at");
    return data ?? [];
  }
  if (name === "top_institutions_by_reps") {
    const limit = args.limit ?? 5;
    const { data } = await admin.from("institution_representatives").select("institution_id");
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r: any) => { counts[r.institution_id] = (counts[r.institution_id] ?? 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
    const ids = top.map(([id]) => id);
    if (!ids.length) return [];
    const { data: insts } = await admin.from("institutions").select("id,name").in("id", ids);
    const byId = Object.fromEntries((insts ?? []).map((i: any) => [i.id, i.name]));
    return top.map(([id, count]) => ({ institution: byId[id] ?? id, representatives: count }));
  }
  return { error: "unknown_tool" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
