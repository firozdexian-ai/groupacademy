// Daily settlement: marks unpaid reviewer ledger entries as paid (real wallet integration in 5.7).
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
  const { data, error } = await admin
    .from("reviewer_credit_ledger")
    .update({ paid_at: new Date().toISOString() })
    .is("paid_at", null)
    .select("id");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  return new Response(JSON.stringify({ paid: data?.length || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
