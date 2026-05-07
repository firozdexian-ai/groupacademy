// Suggest a team + split for a milestone using gig_matches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { milestone_id, gig_id, role_count = 1 } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let matches: any[] = [];
    if (gig_id) {
      const { data } = await admin
        .from("gig_matches")
        .select("talent_id, score, why_text")
        .eq("gig_id", gig_id)
        .order("score", { ascending: false })
        .limit(Math.max(role_count * 4, 4));
      matches = data || [];
    }
    const split = role_count > 0 ? Math.floor(100 / role_count) : 100;
    const team = matches.slice(0, role_count).map((m, i) => ({
      talent_id: m.talent_id,
      score: m.score,
      role: `Role ${i + 1}`,
      split_pct: i === role_count - 1 ? 100 - split * (role_count - 1) : split,
      reason: m.why_text,
    }));

    return new Response(JSON.stringify({ milestone_id, team }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
