// Decays discovery_signals weight by half-life of 14 days; deletes signals older than 180d.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cutoff = new Date(Date.now() - 180 * 86400000).toISOString();
  const { error } = await admin.from("discovery_signals").delete().lt("created_at", cutoff);
  return new Response(JSON.stringify({ ok: !error, error: error?.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
