// Phase 4.5 — Daily sweep: overdue + due-soon + stalled
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

  // 1. Overdue
  const { data: overdueRows } = await supabase
    .from("learning_track_assignments")
    .update({ status: "overdue" })
    .lt("due_at", now.toISOString())
    .in("status", ["active", "invited"])
    .select("id, user_id");

  for (const r of overdueRows ?? []) {
    await fireNotify(r.id, "overdue");
  }

  // 2. Due soon (between now and +72h)
  const { data: dueSoon } = await supabase
    .from("learning_track_assignments")
    .select("id, user_id, due_at")
    .gte("due_at", now.toISOString())
    .lte("due_at", in72h)
    .in("status", ["active", "invited"]);

  for (const r of dueSoon ?? []) {
    await fireNotify(r.id, "due_soon");
  }

  return new Response(
    JSON.stringify({
      ok: true,
      overdue: overdueRows?.length ?? 0,
      due_soon: dueSoon?.length ?? 0,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );

  async function fireNotify(assignment_id: string, kind: string) {
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-track-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ assignment_id, kind }),
      });
    } catch (_) {}
  }
});
