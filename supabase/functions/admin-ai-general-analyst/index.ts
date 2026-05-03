// Admin AI General Analyst — operator-side console for the platform concierge.
// Tools: profile completion stats, talent search, broadcast nudges.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { augmentLastUserMessage } from "../_shared/attachments.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "profile_completion_stats",
      description:
        "Returns counts of total talents, with CV, with profession, with phone, fully complete (CV+profession+phone).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "talents_missing",
      description:
        "List talents missing a piece of profile data. field ∈ {cv, profession, phone, role}. limit defaults to 20.",
      parameters: {
        type: "object",
        properties: {
          field: { type: "string", enum: ["cv", "profession", "phone", "role"] },
          limit: { type: "integer" },
        },
        required: ["field"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "nudge_talents",
      description:
        "Send an in-app notification to a list of talent ids. Use sparingly. Returns count delivered.",
      parameters: {
        type: "object",
        properties: {
          talent_ids: { type: "array", items: { type: "string" } },
          title: { type: "string" },
          message: { type: "string" },
          link: { type: "string" },
        },
        required: ["talent_ids", "title", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "talents_signed_up",
      description: "Count talents created since an ISO date (optional; default all-time).",
      parameters: { type: "object", properties: { since: { type: "string" } } },
    },
  },
];

const SYSTEM = `You are AI General's operator console for the GroUp Academy super admin.
AI General is the concierge that talks to logged-in users.
Answer questions about engagement and profile completion by CALLING TOOLS.
Before calling nudge_talents, ALWAYS confirm the count and the message text in your reply
and ask the operator to say "yes send it" — do not nudge on the first turn.
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

    return json({ content: "Couldn't complete after several tool calls." });
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
    case "profile_completion_stats": {
      const head = (q: any) => q.select("id", { head: true, count: "exact" });
      const [total, withCV, withProf, withPhone, complete] = await Promise.all([
        head(admin.from("talents")).then((r: any) => r.count ?? 0),
        head(admin.from("talents")).not("cv_url", "is", null).then((r: any) => r.count ?? 0),
        head(admin.from("talents")).not("profession_category_id", "is", null).then((r: any) => r.count ?? 0),
        head(admin.from("talents")).not("phone", "is", null).then((r: any) => r.count ?? 0),
        head(admin.from("talents"))
          .not("cv_url", "is", null)
          .not("profession_category_id", "is", null)
          .not("phone", "is", null)
          .then((r: any) => r.count ?? 0),
      ]);
      return { total, with_cv: withCV, with_profession: withProf, with_phone: withPhone, complete };
    }
    case "talents_missing": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 20));
      let q = admin
        .from("talents")
        .select("id, full_name, email, country, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (args.field === "cv") q = q.is("cv_url", null);
      else if (args.field === "profession") q = q.is("profession_category_id", null);
      else if (args.field === "phone") q = q.is("phone", null);
      else if (args.field === "role") q = q.is("professional_role_id", null);
      const { data } = await q;
      return { rows: data ?? [], count: data?.length ?? 0 };
    }
    case "nudge_talents": {
      const ids: string[] = (args.talent_ids ?? []).slice(0, 500);
      if (!ids.length) return { delivered: 0 };
      const rows = ids.map((id) => ({
        talent_id: id,
        type: "ai_general_nudge",
        title: args.title,
        message: args.message,
        link: args.link ?? "/app/profile",
        icon: "bell",
      }));
      const { error } = await admin.from("notifications").insert(rows);
      if (error) return { error: error.message };
      return { delivered: rows.length };
    }
    case "talents_signed_up": {
      let q = admin.from("talents").select("id", { head: true, count: "exact" });
      if (args.since) q = q.gte("created_at", args.since);
      const { count } = await q;
      return { count: count ?? 0 };
    }
    default:
      return { error: `unknown tool: ${name}` };
  }
}
