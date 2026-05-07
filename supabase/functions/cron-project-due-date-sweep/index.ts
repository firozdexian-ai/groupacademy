// Daily: detect at-risk + overdue milestones and notify parties.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const soon = new Date(Date.now() + 48 * 3600e3).toISOString();
  const now = new Date().toISOString();

  const { data: atRisk } = await admin
    .from("gig_project_milestones")
    .select("id, project_id, title, due_at, status")
    .in("status", ["open", "in_progress", "revising"])
    .not("due_at", "is", null)
    .lt("due_at", soon);

  for (const m of atRisk || []) {
    const overdue = new Date(m.due_at!).getTime() < Date.now();
    // Notify assigned talents
    const { data: assigns } = await admin
      .from("gig_project_assignments")
      .select("talent_id, talents(user_id)")
      .eq("milestone_id", m.id)
      .eq("status", "accepted");
    for (const a of assigns || []) {
      const uid = (a as any).talents?.user_id;
      if (uid) {
        await admin.from("notifications").insert({
          user_id: uid,
          type: overdue ? "milestone_overdue" : "milestone_due_soon",
          title: overdue ? "Milestone overdue" : "Milestone due soon",
          body: m.title,
          data: { milestone_id: m.id, project_id: m.project_id, due_at: m.due_at },
        }).catch(() => {});
      }
    }
  }
  return new Response(JSON.stringify({ ok: true, count: atRisk?.length || 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
