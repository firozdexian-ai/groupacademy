// Notify a hot gig match (score >= 0.85) — in-app + future email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { match_id } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: m } = await admin.from("gig_matches").select("*, talents:talent_id(user_id)").eq("id", match_id).maybeSingle();
    if (!m) throw new Error("match missing");
    const userId = (m as any).talents?.user_id;
    if (!userId) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    await admin.from("notifications").insert({
      user_id: userId,
      type: "gig_match_hot",
      title: "New gig match for you",
      message: m.why_text?.slice(0, 240) ?? `Score ${m.score}`,
      metadata: { match_id, gig_id: m.gig_id, gig_kind: m.gig_kind, score: m.score },
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), { status: 500, headers: corsHeaders });
  }
});
