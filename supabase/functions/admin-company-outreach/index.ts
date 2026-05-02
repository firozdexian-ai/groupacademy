// Admin Company Outreach — invite uploaded company contacts who have no Gro10x account.
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
      description: "Counts of company contacts: never_contacted, contacted, responded, signed_up.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "unregistered_contacts",
      description: "List company contacts without a Gro10x account. Filter by has_email/source.",
      parameters: {
        type: "object",
        properties: {
          has_email: { type: "boolean" },
          source: { type: "string", description: "manual | batch_upload | cv_match | admin" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recent_outreach",
      description: "Recent outreach attempts. limit default 20.",
      parameters: { type: "object", properties: { limit: { type: "integer" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "send_invite",
      description:
        "Queue claim-your-profile invite emails to a list of contact ids. Restate count and ask for confirmation first.",
      parameters: {
        type: "object",
        properties: {
          contact_ids: { type: "array", items: { type: "string" } },
          subject: { type: "string" },
          message: { type: "string" },
        },
        required: ["contact_ids", "subject", "message"],
      },
    },
  },
];

const SYSTEM = `You are the Company Outreach operator console for the GroUp Academy / Gro10x super admin.
Help the admin invite uploaded company contacts (and CV-matched contacts) to claim their Gro10x profile.
Always CALL TOOLS for stats. Before send_invite, restate the count + subject/message and ask "yes send it".
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
          try { toolResult = await runTool(admin, tc.function.name, args, userData.user.id); }
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

async function runTool(admin: any, name: string, args: any, actorId: string) {
  switch (name) {
    case "outreach_queue_status": {
      const totals = await admin.from("contacts")
        .select("id", { head: true, count: "exact" }).is("user_id", null);
      const logRows = await admin.from("company_outreach_log")
        .select("contact_id, status").limit(5000);
      const contactedIds = new Set<string>();
      const responded = new Set<string>();
      const signed = new Set<string>();
      for (const r of logRows.data ?? []) {
        if (r.contact_id) contactedIds.add(r.contact_id);
        if (r.status === "responded") responded.add(r.contact_id);
        if (r.status === "signed_up") signed.add(r.contact_id);
      }
      return {
        total_unregistered: totals.count ?? 0,
        contacted: contactedIds.size,
        never_contacted: Math.max(0, (totals.count ?? 0) - contactedIds.size),
        responded: responded.size,
        signed_up: signed.size,
      };
    }
    case "unregistered_contacts": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 25));
      let q = admin.from("contacts")
        .select("id, full_name, email, designation, source, company_id, companies(name), created_at")
        .is("user_id", null)
        .order("created_at", { ascending: false }).limit(limit);
      if (args.has_email === true) q = q.not("email", "is", null);
      if (args.has_email === false) q = q.is("email", null);
      if (args.source) q = q.eq("source", args.source);
      const { data } = await q;
      return { rows: data ?? [] };
    }
    case "recent_outreach": {
      const limit = Math.min(100, Math.max(1, args.limit ?? 20));
      const { data } = await admin.from("company_outreach_log")
        .select("contact_id, channel, subject, status, sent_at, response_at")
        .order("sent_at", { ascending: false }).limit(limit);
      return { rows: data ?? [] };
    }
    case "send_invite": {
      const ids: string[] = (args.contact_ids ?? []).filter(Boolean);
      if (ids.length === 0) return { sent: 0, skipped: 0 };
      const { data: contacts } = await admin.from("contacts")
        .select("id, email, full_name, company_id, companies(name)").in("id", ids);
      let sent = 0; let skipped = 0;
      const logs: any[] = [];
      for (const c of contacts ?? []) {
        if (!c.email) { skipped++; continue; }
        try {
          const subject = String(args.subject ?? "Claim your Gro10x company profile");
          const body = String(args.message ?? "")
            .replace(/\{\{\s*name\s*\}\}/gi, c.full_name ?? "there")
            .replace(/\{\{\s*company\s*\}\}/gi, c.companies?.name ?? "your company");
          const r = await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "talent-invite",
              recipientEmail: c.email,
              templateData: { name: c.full_name ?? "", personal_note: body },
            },
          });
          if (r.error) {
            logs.push({ contact_id: c.id, company_id: c.company_id, channel: "email",
              subject, message: body, status: "failed", sent_by: actorId,
              metadata: { error: String(r.error) } });
            skipped++;
          } else {
            logs.push({ contact_id: c.id, company_id: c.company_id, channel: "email",
              subject, message: body, status: "sent", template: "talent-invite", sent_by: actorId });
            sent++;
          }
        } catch (e) {
          logs.push({ contact_id: c.id, company_id: c.company_id, channel: "email",
            subject: String(args.subject ?? ""), message: String(args.message ?? ""),
            status: "failed", sent_by: actorId, metadata: { error: String(e) } });
          skipped++;
        }
      }
      if (logs.length) await admin.from("company_outreach_log").insert(logs);
      return { sent, skipped, total: ids.length };
    }
    default: return { error: `unknown tool: ${name}` };
  }
}
