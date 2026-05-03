import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { augmentLastUserMessage } from "../_shared/attachments.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are the Fundraising FP&A analyst for Group Academy / Gro10x.
You help the founder build a fundraising strategy: MRR/ARR analysis, runway, narrative, target investor types, and pitch talking points.
Use available tools to ground every claim in real DB data. Be concise, structured, and outcome-focused. Never fabricate numbers.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPA_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(SUPA_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPA_URL, SUPA_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const { messages = [], session_id, attachments } = await req.json();

    const tools = [
      { type: "function", function: { name: "mrr_targets_read", description: "Read MRR targets and progress", parameters: { type: "object", properties: {} } } },
      { type: "function", function: { name: "investor_pipeline_summary", description: "VC + investor pipeline stats by status", parameters: { type: "object", properties: {} } } },
      { type: "function", function: { name: "credits_revenue_summary", description: "Last 30/90 day credit revenue", parameters: { type: "object", properties: {} } } },
      { type: "function", function: { name: "outreach_activity", description: "IR outreach activity in last N days", parameters: { type: "object", properties: { days: { type: "number" } } } } },
    ];

    let convo = [{ role: "system", content: SYSTEM }, ...messages];
    await augmentLastUserMessage(admin, convo, attachments);
    let final = "";
    for (let i = 0; i < 4; i++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-pro", messages: convo, tools }),
      });
      if (r.status === 429) return json({ error: "Rate limit, please retry" }, 429);
      if (r.status === 402) return json({ error: "AI credits exhausted" }, 402);
      const j = await r.json();
      const msg = j.choices?.[0]?.message;
      if (!msg) return json({ error: "AI error", detail: j }, 500);
      convo.push(msg);
      const calls = msg.tool_calls;
      if (!calls?.length) { final = msg.content || ""; break; }
      for (const c of calls) {
        const args = JSON.parse(c.function.arguments || "{}");
        const result = await runTool(admin, c.function.name, args);
        convo.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }

    if (session_id) {
      await admin.from("ir_fpa_conversations").upsert({
        session_id: String(session_id),
        user_id: user.id,
        last_question: messages[messages.length - 1]?.content?.slice(0, 500),
        last_answer_summary: final.slice(0, 500),
        message_count: messages.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "session_id" });
    }

    return json({ content: final });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

async function runTool(admin: any, name: string, args: any) {
  if (name === "mrr_targets_read") {
    const { data } = await admin.from("ir_mrr_targets").select("*").order("target_date", { ascending: true }).limit(24);
    return { targets: data || [] };
  }
  if (name === "investor_pipeline_summary") {
    const [{ data: vcs }, { data: invs }] = await Promise.all([
      admin.from("vc_firms").select("status"),
      admin.from("investors").select("status"),
    ]);
    const tally = (rows: any[] = []) => rows.reduce((a, r) => (a[r.status || "unknown"] = (a[r.status || "unknown"] || 0) + 1, a), {} as Record<string, number>);
    return { vcs: tally(vcs || []), investors: tally(invs || []) };
  }
  if (name === "credits_revenue_summary") {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
    const [{ count: c30 }, { count: c90 }] = await Promise.all([
      admin.from("credit_purchases").select("*", { count: "exact", head: true }).gte("created_at", since30),
      admin.from("credit_purchases").select("*", { count: "exact", head: true }).gte("created_at", since90),
    ]);
    return { purchases_30d: c30 || 0, purchases_90d: c90 || 0 };
  }
  if (name === "outreach_activity") {
    const days = args?.days || 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data } = await admin.from("ir_outreach_log").select("target_type, channel").gte("created_at", since);
    return { count: data?.length || 0, breakdown: data || [] };
  }
  return { error: "unknown tool" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
