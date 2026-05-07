// Reads a milestone and returns a clear "what done looks like" brief for the talent.
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

    const { milestone_id } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: m } = await admin
      .from("gig_project_milestones")
      .select("title, summary, acceptance_criteria, budget_credits, due_at")
      .eq("id", milestone_id)
      .maybeSingle();
    if (!m) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: corsHeaders });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a milestone coach. Return JSON with keys: what_done_looks_like (string), checklist (array of 4-7 short items), submission_tips (array of 2-4 short items)." },
          { role: "user", content: JSON.stringify(m) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    const json = await r.json();
    let payload: any = {};
    try { payload = JSON.parse(json?.choices?.[0]?.message?.content || "{}"); } catch { /* */ }
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
