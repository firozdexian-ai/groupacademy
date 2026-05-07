// Weekly project status digest — emails poster a 6-line summary.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: projects } = await admin.from("gig_projects").select("id, title, company_id, created_by").in("status", ["active","funded"]);
  let sent = 0;
  for (const p of projects ?? []) {
    const summary = await admin.functions.invoke("ai-project-status-summary", { body: { project_id: p.id } }).catch(() => null);
    const text = (summary as { data?: { summary?: string } } | null)?.data?.summary;
    if (!text) continue;
    await admin.functions.invoke("send-transactional-email", {
      body: { template: "project_weekly_digest", to_user_id: p.created_by, data: { project: p.title, summary: text } },
    }).catch(() => {});
    sent++;
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
