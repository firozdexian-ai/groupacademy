// Admin Institutions Outreach — drafts mailto B2B messages to universities,
// colleges, training partners and partner organizations. No emails are sent
// from the platform; the operator opens mailto: links in their own client.
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
      name: "list_institutions",
      description: "List institutions optionally filtered by type or status. limit defaults to 25.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string" },
          status: { type: "string" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_representatives",
      description: "List representatives, optionally for a given institution_id. limit defaults to 25.",
      parameters: {
        type: "object",
        properties: {
          institution_id: { type: "string" },
          limit: { type: "integer" },
        },
      },
    },
  },
];

const SYSTEM = `You are the Institutions Outreach drafter for GroUp Academy super admin.
You help draft warm, personal B2B emails to universities, colleges, training
partners, and partner organizations.
- Always CALL TOOLS to look up current data; never invent contacts.
- For each suggested message, output a markdown mailto: link the operator can
  click. Format: [Email NAME](mailto:EMAIL?subject=...&body=...).
- Subjects must be short and specific. Bodies should be 4–8 short lines.
- Never claim that the platform sent anything. The operator sends from their
  own email client.
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
      if (!calls.length) return json({ message: choice?.content ?? "" });
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
  if (name === "list_institutions") {
    const limit = args.limit ?? 25;
    let q = admin.from("institutions").select("id,name,type,country,website,contact_name,contact_email,contact_phone,status").limit(limit);
    if (args.type) q = q.eq("type", args.type);
    if (args.status) q = q.eq("status", args.status);
    const { data } = await q;
    return data ?? [];
  }
  if (name === "list_representatives") {
    const limit = args.limit ?? 25;
    let q = admin.from("institution_representatives").select("id,institution_id,name,role,email,phone").limit(limit);
    if (args.institution_id) q = q.eq("institution_id", args.institution_id);
    const { data } = await q;
    return data ?? [];
  }
  return { error: "unknown_tool" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
