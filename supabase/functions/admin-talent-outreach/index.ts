// Admin Talent Outreach Agent — operator console for inviting uploaded talents
// (CV / batch / gig sources) who haven't yet claimed an account.
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
      name: "outreach_queue_status",
      description:
        "Counts of uploaded talents segmented by outreach status: never_contacted, contacted, responded, signed_up.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "unregistered_talents",
      description:
        "List uploaded talents without an auth account. Filter by has_email/has_phone/has_cv. limit defaults to 25.",
      parameters: {
        type: "object",
        properties: {
          has_email: { type: "boolean" },
          has_phone: { type: "boolean" },
          has_cv: { type: "boolean" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recent_outreach",
      description: "Recent outreach attempts. limit defaults to 20.",
      parameters: { type: "object", properties: { limit: { type: "integer" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "send_invite",
      description:
        "Queue claim-your-profile invite emails to a list of talent ids. Confirm count and message before calling.",
      parameters: {
        type: "object",
        properties: {
          talent_ids: { type: "array", items: { type: "string" } },
          subject: { type: "string" },
          message: { type: "string" },
        },
        required: ["talent_ids", "subject", "message"],
      },
    },
  },
];

const SYSTEM = `You are the Talent Outreach operator console for GroUp Academy super admin.
Your job is to help the admin invite uploaded-but-unregistered talents to claim their profile.
Always CALL TOOLS for any number; never invent stats.
Before calling send_invite, restate the recipient count and the subject/message and ask the
operator to say "yes send it". Be concise. Use markdown. Today: ${new Date().toISOString().slice(0, 10)}.`;

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
          try {
            toolResult = await runTool(admin, tc.function.name, args, userData.user.id);
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

    return json({ content: "Reached tool-call limit without a final answer." });
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

async function runTool(admin: any, name: string, args: any, actorId: string) {
  switch (name) {
    case "outreach_queue_status": {
      const totals = await admin
        .from("talents").select("id", { head: true, count: "exact" }).is("user_id", null);
      const contactedRows = await admin
        .from("talent_outreach_log").select("talent_id, status").limit(5000);
      const contactedIds = new Set<string>();
      const responded = new Set<string>();
      const signed = new Set<string>();
      for (const r of contactedRows.data ?? []) {
        if (r.talent_id) contactedIds.add(r.talent_id);
        if (r.status === "responded") responded.add(r.talent_id);
        if (r.status === "signed_up") signed.add(r.talent_id);
      }
      return {
        total_unregistered: totals.count ?? 0,
        contacted: contactedIds.size,
        never_contacted: Math.max(0, (totals.count ?? 0) - contactedIds.size),
        responded: responded.size,
        signed_up: signed.size,
      };
    }
    case "unregistered_talents": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 25));
      let q = admin.from("talents")
        .select("id, full_name, email, phone, cv_url, headline:custom_profession, country, created_at")
        .is("user_id", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (args.has_email === true) q = q.not("email", "is", null);
      if (args.has_email === false) q = q.is("email", null);
      if (args.has_phone === true) q = q.not("phone", "is", null);
      if (args.has_phone === false) q = q.is("phone", null);
      if (args.has_cv === true) q = q.not("cv_url", "is", null);
      if (args.has_cv === false) q = q.is("cv_url", null);
      const { data } = await q;
      return { rows: data ?? [] };
    }
    case "recent_outreach": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 20));
      const { data } = await admin.from("talent_outreach_log")
        .select("talent_id, channel, subject, status, sent_at, response_at")
        .order("sent_at", { ascending: false })
        .limit(limit);
      return { rows: data ?? [] };
    }
    case "send_invite": {
      const ids: string[] = (args.talent_ids ?? []).filter(Boolean);
      if (ids.length === 0) return { sent: 0, skipped: 0 };
      const { data: talents } = await admin.from("talents")
        .select("id, email, full_name").in("id", ids);
      let sent = 0; let skipped = 0;
      const logs: any[] = [];
      for (const t of talents ?? []) {
        if (!t.email) { skipped++; continue; }
        try {
          const subject = String(args.subject ?? "Claim your GroUp Academy profile");
          const body = String(args.message ?? "")
            .replace(/\{\{\s*name\s*\}\}/gi, t.full_name ?? "there");
          const r = await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "talent-invite",
              recipientEmail: t.email,
              templateData: { name: t.full_name ?? "", personal_note: body },
            },
          });
          if (r.error) {
            logs.push({ talent_id: t.id, channel: "email", subject, message: body,
              status: "failed", sent_by: actorId, metadata: { error: String(r.error) } });
            skipped++;
          } else {
            logs.push({ talent_id: t.id, channel: "email", subject, message: body,
              status: "sent", template: "talent-invite", sent_by: actorId });
            sent++;
          }
        } catch (e) {
          logs.push({ talent_id: t.id, channel: "email", subject: String(args.subject ?? ""),
            message: String(args.message ?? ""), status: "failed",
            sent_by: actorId, metadata: { error: String(e) } });
          skipped++;
        }
      }
      if (logs.length) await admin.from("talent_outreach_log").insert(logs);
      return { sent, skipped, total: ids.length };
    }
    default:
      return { error: `unknown tool: ${name}` };
  }
}
