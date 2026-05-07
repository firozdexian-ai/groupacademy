// 2-paragraph SEO description for a public gig listing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = req.headers.get("Authorization") || "";
  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

  const { project_id } = await req.json();
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: p } = await admin.from("gig_projects").select("title, summary, category").eq("id", project_id).maybeSingle();

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Write 2 short paragraphs (~150 words total) summarizing this project for SEO + social share. Plain text, no headings." },
        { role: "user", content: JSON.stringify(p) },
      ],
    }),
  });
  const json = await r.json();
  const text = json?.choices?.[0]?.message?.content || p?.summary || p?.title || "";
  await admin.from("project_public_settings").update({ seo_description: text.slice(0, 300) }).eq("project_id", project_id);
  return new Response(JSON.stringify({ summary: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
