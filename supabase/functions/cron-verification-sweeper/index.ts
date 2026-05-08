// Cron: pick up submissions lacking a verification and run the verifier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const limit = 25;

  const { data: rows, error } = await admin
    .from("gig_submissions_unified_view")
    .select("submission_id, gig_kind, status")
    .in("status", ["pending", "submitted"])
    .limit(limit);
  if (error) {
    console.error("sweeper query error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  for (const r of rows ?? []) {
    const { data: existing } = await admin
      .from("gig_verifications")
      .select("id")
      .eq("submission_id", r.submission_id)
      .eq("gig_kind", r.gig_kind)
      .maybeSingle();
    if (existing) continue;
    try {
      await admin.functions.invoke("ai-gig-verifier", {
        body: { submission_id: r.submission_id, gig_kind: r.gig_kind },
      });
      processed += 1;
    } catch (e) {
      console.error("verifier invoke failed", e);
    }
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
