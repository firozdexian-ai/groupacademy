// Drafts a 4-section markdown case study for a public project listing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { project_id } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: p }, { data: ms }] = await Promise.all([
      admin.from("gig_projects").select("title, summary, category, budget_credits, currency_display").eq("id", project_id).maybeSingle(),
      admin.from("gig_project_milestones").select("seq,title,summary,status").eq("project_id", project_id).order("seq"),
    ]);

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Write a public case study in markdown with 4 H2 sections: Brief, Approach, Outcome, Team. Tight, factual, no marketing fluff. ~250 words." },
          { role: "user", content: JSON.stringify({ project: p, milestones: ms }) },
        ],
      }),
    });
    const json = await r.json();
    const md = json?.choices?.[0]?.message?.content || "## Brief\n_Draft pending._";
    await admin.from("project_public_settings").upsert({ project_id, case_study_md: md }, { onConflict: "project_id" } as never);
    return new Response(JSON.stringify({ markdown: md }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
