// Plain-English status summary for a project.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { project_id } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: p }, { data: ms }, { data: esc }] = await Promise.all([
      admin.from("gig_projects").select("*").eq("id", project_id).maybeSingle(),
      admin.from("gig_project_milestones").select("*").eq("project_id", project_id).order("seq"),
      admin.from("gig_escrow_accounts").select("*").eq("project_id", project_id).maybeSingle(),
    ]);

    const ctx = { project: p, milestones: ms, escrow: esc };
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Write a concise 4-6 sentence status update for a B2B managed project. Mention progress, escrow position (held/released), upcoming due dates, and any blockers." },
          { role: "user", content: JSON.stringify(ctx) },
        ],
      }),
    });
    const json = await r.json();
    const text = json?.choices?.[0]?.message?.content || "Status unavailable.";
    return new Response(JSON.stringify({ summary: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
