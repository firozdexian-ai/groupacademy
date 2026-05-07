// Weekly digest of project signals to project owners.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: pps } = await admin.from("project_public_settings").select("project_id, view_count, share_count, slug, seo_title").eq("is_public", true);
  let sent = 0;
  for (const p of pps ?? []) {
    if ((p.view_count ?? 0) < 25 && (p.share_count ?? 0) < 5) continue;
    await admin.functions.invoke("send-transactional-email", {
      body: { template: "project_listing_digest", to_project_id: p.project_id,
        data: { title: p.seo_title, slug: p.slug, views: p.view_count, shares: p.share_count } },
    }).catch(() => {});
    sent++;
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
