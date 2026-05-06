// Expires stale offered/claimed gig review assignments + applies reputation hit.
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
  const now = new Date().toISOString();

  // Expire offered older than 4h with no claim
  const { data: offered } = await admin
    .from("gig_review_assignments")
    .select("id,reviewer_id")
    .eq("status", "offered")
    .lt("offered_at", new Date(Date.now() - 4 * 3600e3).toISOString())
    .limit(200);
  for (const a of offered || []) {
    await admin.from("gig_review_assignments").update({ status: "expired", updated_at: now }).eq("id", a.id);
  }

  // Expire claimed past due_at
  const { data: claimed } = await admin
    .from("gig_review_assignments")
    .select("id,reviewer_id")
    .eq("status", "claimed")
    .lt("due_at", now)
    .limit(200);
  for (const a of claimed || []) {
    await admin.from("gig_review_assignments").update({ status: "expired", updated_at: now }).eq("id", a.id);
    await admin.from("reviewer_reputation_events").insert({
      talent_id: a.reviewer_id,
      event: "assignment_expired",
      weight: -0.5,
      assignment_id: a.id,
    });
  }

  return new Response(JSON.stringify({ expired_offered: offered?.length || 0, expired_claimed: claimed?.length || 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
