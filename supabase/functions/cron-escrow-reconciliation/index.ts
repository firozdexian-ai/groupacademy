// Daily: invariant check on escrow accounts; alert on drift.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const drift: any[] = [];
  const { data: accounts } = await admin.from("gig_escrow_accounts").select("*");
  for (const a of accounts || []) {
    const { data: ledger } = await admin
      .from("gig_escrow_ledger")
      .select("delta, kind")
      .eq("project_id", a.project_id);
    let funded = 0, released = 0, refunded = 0, held = 0;
    for (const r of ledger || []) {
      if (r.kind === "fund") funded += Number(r.delta);
      else if (r.kind === "release") released += -Number(r.delta);
      else if (r.kind === "refund") refunded += -Number(r.delta);
      else if (r.kind === "hold") held += Number(r.delta);
    }
    const expected = funded - released - refunded - (Number(a.held_credits) || 0);
    if (Math.abs(expected - Number(a.balance_credits)) > 0.5) {
      drift.push({ project_id: a.project_id, expected, actual: a.balance_credits });
    }
  }
  return new Response(JSON.stringify({ ok: true, drift }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
