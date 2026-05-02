// Admin Company AI General — analytics + in-app messaging for registered
// company-side users (Gro10x). Super-admin only.
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
      name: "registered_company_users",
      description: "Count contacts that are registered (have user_id). since ISO date optional.",
      parameters: { type: "object", properties: { since: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_registered_users",
      description: "List up to N registered company contacts with company name. limit default 25.",
      parameters: { type: "object", properties: { limit: { type: "integer" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "send_in_app_message",
      description:
        "Send an in-app notification to a list of registered user_ids. Confirm count and body before calling.",
      parameters: {
        type: "object",
        properties: {
          user_ids: { type: "array", items: { type: "string" } },
          title: { type: "string" },
          body: { type: "string" },
        },
        required: ["user_ids", "title", "body"],
      },
    },
  },
];

const SYSTEM = `You are the Company AI General operator console for Gro10x super admin.
Always call tools — never invent stats. For send_in_app_message, restate count + body and ask for "yes send it".
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
    case "registered_company_users": {
      let q = admin.from("contacts").select("id", { head: true, count: "exact" })
        .not("user_id", "is", null);
      if (args.since) q = q.gte("created_at", args.since);
      const { count } = await q;
      return { count: count ?? 0, since: args.since ?? null };
    }
    case "list_registered_users": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 25));
      const { data } = await admin.from("contacts")
        .select("id, full_name, email, designation, user_id, company_id, companies(name)")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false }).limit(limit);
      return { rows: data ?? [] };
    }
    case "send_in_app_message": {
      const ids: string[] = (args.user_ids ?? []).filter(Boolean);
      if (ids.length === 0) return { sent: 0 };
      // Resolve user_ids → talent_ids when possible (notifications keyed by talent)
      const { data: tRows } = await admin.from("talents")
        .select("id, user_id").in("user_id", ids);
      const map = new Map<string, string>();
      for (const r of tRows ?? []) if (r.user_id) map.set(r.user_id, r.id);
      const rows: any[] = [];
      for (const uid of ids) {
        const tid = map.get(uid);
        if (!tid) continue;
        rows.push({
          talent_id: tid,
          type: "admin_broadcast",
          title: String(args.title ?? "Message from GroUp Academy"),
          message: String(args.body ?? ""),
        });
      }
      if (rows.length === 0) return { sent: 0, skipped: ids.length, note: "no matching talent profiles" };
      const { error } = await admin.from("notifications").insert(rows);
      if (error) return { sent: 0, error: error.message };
      return { sent: rows.length, skipped: ids.length - rows.length };
    }
    default: return { error: `unknown tool: ${name}` };
  }
}
