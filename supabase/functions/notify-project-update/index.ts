import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { project_id, milestone_id, kind, title, body } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const recipients = new Set<string>();
    const { data: p } = await admin.from("gig_projects").select("company_id, created_by").eq("id", project_id).maybeSingle();
    if (p?.created_by) recipients.add(p.created_by);
    const { data: members } = await admin.from("company_members").select("user_id").eq("company_id", p?.company_id).eq("status", "active");
    for (const m of members || []) recipients.add(m.user_id);
    if (milestone_id) {
      const { data: assigns } = await admin
        .from("gig_project_assignments")
        .select("talents(user_id)")
        .eq("milestone_id", milestone_id);
      for (const a of assigns || []) {
        const uid = (a as any).talents?.user_id;
        if (uid) recipients.add(uid);
      }
    }
    for (const uid of recipients) {
      await admin.from("notifications").insert({
        user_id: uid,
        type: `project_${kind || "update"}`,
        title: title || "Project update",
        body: body || "",
        data: { project_id, milestone_id, kind },
      }).catch(() => {});
    }
    return new Response(JSON.stringify({ ok: true, recipients: recipients.size }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
