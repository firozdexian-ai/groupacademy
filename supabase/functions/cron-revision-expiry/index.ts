// Cron daily: expire revision requests past due_at, fire trust event.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: expired } = await admin
    .from("gig_revision_requests")
    .select("id, talent_id, verification_id")
    .eq("status", "open")
    .lt("due_at", new Date().toISOString());

  for (const r of expired ?? []) {
    await admin.from("gig_revision_requests").update({ status: "expired" }).eq("id", r.id);
    await admin.from("gig_verifications").update({ verdict: "human_rejected", rationale: "Revision window expired" }).eq("id", r.verification_id);
    await admin.rpc("apply_verification_verdict", { _verification_id: r.verification_id });
    await admin.from("talent_trust_events").insert({
      talent_id: r.talent_id, event: "revision_expired", weight: -2.0, verification_id: r.verification_id,
    });
  }

  return new Response(JSON.stringify({ expired: expired?.length ?? 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
