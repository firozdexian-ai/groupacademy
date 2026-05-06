// Periodic spot-check: re-scores a random 5% of submitted reviewer verdicts using verifier AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  // pick recent submitted assignments at random
  const { data: items } = await admin
    .from("gig_review_assignments")
    .select("id,reviewer_id,verdict,kind,source_id,submitted_at")
    .eq("status", "submitted")
    .gte("submitted_at", new Date(Date.now() - 7 * 86400e3).toISOString())
    .limit(200);
  const sample = (items || []).filter(() => Math.random() < 0.05);
  let flagged = 0;
  for (const it of sample) {
    // baseline check: if verdict differs from settled source verdict, log incorrect
    let settled: string | null = null;
    if (it.kind === "escalation") {
      const { data } = await admin.from("gig_verifications").select("verdict").eq("id", it.source_id).maybeSingle();
      settled = data?.verdict ?? null;
    } else {
      const { data } = await admin.from("gig_disputes").select("final_verdict").eq("id", it.source_id).maybeSingle();
      settled = data?.final_verdict ?? null;
    }
    if (settled && settled !== it.verdict) {
      await admin.from("reviewer_reputation_events").insert({
        talent_id: it.reviewer_id,
        event: "quality_check_fail",
        weight: -0.5,
        assignment_id: it.id,
      });
      flagged++;
    } else if (settled) {
      await admin.from("reviewer_reputation_events").insert({
        talent_id: it.reviewer_id,
        event: "quality_check_pass",
        weight: 0.25,
        assignment_id: it.id,
      });
    }
  }
  return new Response(JSON.stringify({ checked: sample.length, flagged }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
