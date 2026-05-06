// Phase 4.5 — Track event notifier
// kinds: assigned, step_completed, track_completed, due_soon, overdue
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { assignment_id, kind } = body ?? {};
    if (!assignment_id || !kind) {
      return new Response(JSON.stringify({ error: "assignment_id and kind required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: a } = await supabase
      .from("learning_track_assignments")
      .select("id, user_id, track_id, due_at, status, learning_tracks(title)")
      .eq("id", assignment_id)
      .maybeSingle();

    if (!a) {
      return new Response(JSON.stringify({ error: "assignment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trackTitle = (a as any).learning_tracks?.title ?? "Learning track";
    const titleMap: Record<string, string> = {
      assigned: `Assigned: ${trackTitle}`,
      step_completed: `Step completed in ${trackTitle}`,
      track_completed: `🎉 Track completed: ${trackTitle}`,
      due_soon: `Due soon: ${trackTitle}`,
      overdue: `Overdue: ${trackTitle}`,
    };

    await supabase.from("notification_dispatch").insert({
      user_id: a.user_id,
      kind: `track.${kind}`,
      title: titleMap[kind] ?? trackTitle,
      payload: { assignment_id, track_id: a.track_id, kind },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
