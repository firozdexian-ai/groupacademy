import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are the Investor Relations Relationship Executive for Group Academy / Gro10x.
You help the founder maintain warm relationships with VCs, investors, and key influencers.
You draft personalized outreach emails (returned as mailto links so the founder sends from their own inbox), suggest follow-ups, and log all interactions.
Tone: warm, sharp, founder-to-investor. Always cite a real reason for reaching out. Never auto-send — produce drafts and mailto links only.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(SUPA_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPA_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const { messages = [] } = await req.json();

    const tools = [
      { type: "function", function: { name: "vc_list", description: "List VC firms with status", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
      { type: "function", function: { name: "investor_list", description: "List investors with status", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
      { type: "function", function: { name: "influencer_list", description: "List key influencers by tier", parameters: { type: "object", properties: { tier: { type: "string" } } } } },
      { type: "function", function: { name: "draft_mailto", description: "Build a mailto link for the founder to send", parameters: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to", "subject", "body"] } } },
      { type: "function", function: { name: "log_interaction", description: "Log an outreach interaction", parameters: { type: "object", properties: { target_type: { type: "string", enum: ["vc","investor","influencer"] }, target_id: { type: "string" }, target_label: { type: "string" }, channel: { type: "string" }, subject: { type: "string" }, body: { type: "string" }, sentiment: { type: "string" } }, required: ["target_type","channel"] } } },
    ];

    let convo = [{ role: "system", content: SYSTEM }, ...messages];
    let final = "";
    for (let i = 0; i < 5; i++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: convo, tools }),
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
        const result = await runTool(admin, user.id, c.function.name, args);
        convo.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }

    return json({ content: final });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

async function runTool(admin: any, userId: string, name: string, args: any) {
  if (name === "vc_list") {
    const { data } = await admin.from("vc_firms").select("id, name, status, focus_areas, contact_email").limit(args?.limit || 25);
    return { rows: data || [] };
  }
  if (name === "investor_list") {
    const { data } = await admin.from("investors").select("id, name, email, status, firm_name").limit(args?.limit || 25);
    return { rows: data || [] };
  }
  if (name === "influencer_list") {
    let q = admin.from("ir_influencers").select("id, name, role, organization, tier, email, tags");
    if (args?.tier) q = q.eq("tier", args.tier);
    const { data } = await q.limit(50);
    return { rows: data || [] };
  }
  if (name === "draft_mailto") {
    const { to, subject, body } = args;
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { mailto: url };
  }
  if (name === "log_interaction") {
    const { data, error } = await admin.from("ir_outreach_log").insert({
      target_type: args.target_type,
      target_id: args.target_id || null,
      target_label: args.target_label || null,
      channel: args.channel,
      subject: args.subject || null,
      body: args.body || null,
      sentiment: args.sentiment || null,
      created_by: userId,
    }).select().single();
    if (error) return { error: error.message };
    return { logged: data };
  }
  return { error: "unknown tool" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
