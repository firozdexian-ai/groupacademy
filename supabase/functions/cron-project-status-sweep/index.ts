// Sweeps milestone/project statuses and emits notifications.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date().toISOString();
  let updated = 0;

  // Auto-complete projects where all milestones are settled
  const { data: projects } = await admin
    .from("gig_projects")
    .select("id, status")
    .eq("status", "active");
  for (const p of projects || []) {
    const { data: open } = await admin
      .from("gig_project_milestones")
      .select("id")
      .eq("project_id", p.id)
      .not("status", "in", "(approved,cancelled,rejected)");
    if (!open || open.length === 0) {
      await admin.from("gig_projects").update({ status: "completed", updated_at: now }).eq("id", p.id);
      updated++;
    }
  }

  return new Response(JSON.stringify({ ok: true, updated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
