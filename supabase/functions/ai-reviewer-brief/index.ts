// Pre-digests a gig review item for a claiming reviewer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { assignment_id } = await req.json();
    if (!assignment_id) throw new Error("assignment_id required");
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: a } = await admin.from("gig_review_assignments").select("*").eq("id", assignment_id).maybeSingle();
    if (!a) throw new Error("assignment not found");

    let context: any = { kind: a.kind };
    if (a.kind === "escalation") {
      const { data: v } = await admin.from("gig_verifications").select("*").eq("id", a.source_id).maybeSingle();
      const { data: g } = v?.gig_id ? await admin.from("gigs").select("title,description,acceptance_criteria,credit_reward").eq("id", v.gig_id).maybeSingle() : { data: null };
      context = { ...context, verification: v, gig: g };
    } else {
      const { data: d } = await admin.from("gig_disputes").select("*").eq("id", a.source_id).maybeSingle();
      const { data: g } = d?.gig_id ? await admin.from("gigs").select("title,description,acceptance_criteria,credit_reward").eq("id", d.gig_id).maybeSingle() : { data: null };
      context = { ...context, dispute: d, gig: g };
    }

    let brief = "Review the item carefully against the acceptance criteria. Render verdict.";
    if (LOVABLE_API_KEY) {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You produce neutral one-paragraph reviewer briefs for gig adjudication. ≤150 words." },
              { role: "user", content: JSON.stringify(context).slice(0, 6000) },
            ],
          }),
        });
        const j = await resp.json();
        brief = j?.choices?.[0]?.message?.content || brief;
      } catch (_) {}
    }

    return new Response(JSON.stringify({ brief, context }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
