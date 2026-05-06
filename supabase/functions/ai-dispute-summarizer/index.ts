// Summarises both sides of a dispute into a neutral fact sheet.
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
    const { dispute_id } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: d } = await admin.from("gig_disputes").select("*").eq("id", dispute_id).maybeSingle();
    if (!d) throw new Error("dispute not found");

    let summary = `Reason: ${d.reason_code}\nNarrative: ${d.narrative}`;
    if (LOVABLE_API_KEY) {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You produce neutral two-sided fact sheets (≤200 words) for dispute panels. No verdicts." },
              { role: "user", content: JSON.stringify(d).slice(0, 6000) },
            ],
          }),
        });
        const j = await resp.json();
        summary = j?.choices?.[0]?.message?.content || summary;
      } catch (_) {}
    }
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
