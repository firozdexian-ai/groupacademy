// Simple originality + AI-detection heuristic for content gigs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function ngramShingles(s: string, n = 5): Set<string> {
  const tokens = (s || "").toLowerCase().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) set.add(tokens.slice(i, i + n).join(" "));
  return set;
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text, submission_id } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    let maxOverlap = 0;
    if (submission_id) {
      const { data: prior } = await admin
        .from("gig_submissions")
        .select("submission_data,id")
        .neq("id", submission_id)
        .order("created_at", { ascending: false })
        .limit(50);
      const a = ngramShingles(text);
      for (const p of prior || []) {
        const t = JSON.stringify(p.submission_data || "");
        const sim = jaccard(a, ngramShingles(t));
        if (sim > maxOverlap) maxOverlap = sim;
      }
    }
    let aiLikelihood = 0;
    if (LOVABLE_API_KEY && text) {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Return ONLY a JSON: {\"ai_likelihood\":0..1}." },
              { role: "user", content: String(text).slice(0, 4000) },
            ],
          }),
        });
        const j = await resp.json();
        const c = j?.choices?.[0]?.message?.content || "";
        const m = c.match(/\{[\s\S]*\}/);
        if (m) aiLikelihood = JSON.parse(m[0]).ai_likelihood ?? 0;
      } catch (_) {}
    }
    return new Response(JSON.stringify({ overlap: maxOverlap, ai_likelihood: aiLikelihood, flags: [
      ...(maxOverlap > 0.4 ? ["plagiarism_suspected"] : []),
      ...(aiLikelihood > 0.7 ? ["ai_generated_suspected"] : []),
    ] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
