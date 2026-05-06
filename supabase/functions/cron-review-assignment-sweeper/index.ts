// Picks up new escalations + open disputes lacking a panel and offers them to top-N matched reviewers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PANEL_SIZE = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let offered = 0;

  const handleSource = async (kind: "escalation" | "dispute", source_id: string, gig_id: string | null, submission_id: string | null) => {
    const { count } = await admin
      .from("gig_review_assignments")
      .select("id", { count: "exact", head: true })
      .eq("kind", kind)
      .eq("source_id", source_id)
      .in("status", ["offered", "claimed", "submitted"]);
    if ((count ?? 0) >= PANEL_SIZE) return;
    const need = PANEL_SIZE - (count ?? 0);

    const { data: reviewers } = await admin
      .from("reviewer_profiles")
      .select("talent_id, tier, accuracy")
      .eq("status", "active")
      .order("accuracy", { ascending: false })
      .limit(need * 4);
    const pool = (reviewers || []).slice(0, need);
    for (const r of pool) {
      await admin.from("gig_review_assignments").insert({
        reviewer_id: r.talent_id,
        kind,
        source_id,
        gig_id,
        submission_id,
        status: "offered",
        due_at: new Date(Date.now() + 24 * 3600e3).toISOString(),
      });
      offered++;
    }
  };

  // Escalations
  const { data: escs } = await admin
    .from("gig_verifications")
    .select("id,gig_id,submission_id")
    .eq("verdict", "escalated")
    .limit(50);
  for (const e of escs || []) await handleSource("escalation", e.id, e.gig_id, e.submission_id);

  // Disputes
  const { data: disps } = await admin
    .from("gig_disputes")
    .select("id,gig_id,submission_id")
    .eq("status", "open")
    .limit(50);
  for (const d of disps || []) {
    await handleSource("dispute", d.id, d.gig_id, d.submission_id);
    await admin.from("gig_disputes").update({ status: "panel" }).eq("id", d.id);
  }

  return new Response(JSON.stringify({ offered }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
