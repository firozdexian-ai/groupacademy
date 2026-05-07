import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { project_id, milestone_id, talent_id, kind, delta } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (talent_id && (kind === "release" || kind === "refund")) {
      const { data: t } = await admin.from("talents").select("user_id").eq("id", talent_id).maybeSingle();
      if (t?.user_id) {
        await admin.from("notifications").insert({
          user_id: t.user_id,
          type: `escrow_${kind}`,
          title: kind === "release" ? "Payout received" : "Escrow refund",
          body: `${Math.abs(Number(delta || 0))} credits`,
          data: { project_id, milestone_id, kind, delta },
        }).catch(() => {});
      }
    }
    if (project_id) {
      const { data: p } = await admin.from("gig_projects").select("created_by").eq("id", project_id).maybeSingle();
      if (p?.created_by) {
        await admin.from("notifications").insert({
          user_id: p.created_by,
          type: `escrow_${kind}`,
          title: `Escrow ${kind}`,
          body: `${Math.abs(Number(delta || 0))} credits`,
          data: { project_id, milestone_id, kind, delta },
        }).catch(() => {});
      }
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
