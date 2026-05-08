// Daily cron: refresh ai_job_recommendations for talents whose cache is >24h old.
// Calls the SECURITY DEFINER RPC cron_rebuild_stale_job_recs(_batch).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const batch = Math.min(500, Number(body?.batch ?? 200));

  const started = Date.now();
  const { data, error } = await supabase.rpc("cron_rebuild_stale_job_recs", { _batch: batch });

  if (error) {
    console.error("[cron-rebuild-job-recs] error", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      processed_talents: data ?? 0,
      duration_ms: Date.now() - started,
    }),
    { headers: { ...corsHeaders, "content-type": "application/json" } },
  );
});
