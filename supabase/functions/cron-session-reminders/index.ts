// cron-session-reminders — runs every ~5 minutes via pg_cron.
// Finds course_sessions in T-24h / T-1h / T-5min windows and dispatches
// session_reminder_t{24,1,5} via notify-learning-event. Idempotent through
// notification_dispatch (UNIQUE scope,scope_id,kind).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WINDOWS: { kind: string; min: number; tolerance: number }[] = [
  { kind: "session_reminder_t24", min: 24 * 60, tolerance: 6 },
  { kind: "session_reminder_t1", min: 60, tolerance: 6 },
  { kind: "session_reminder_t5", min: 5, tolerance: 4 },
  { kind: "session_live", min: 0, tolerance: 4 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = Date.now();
  const dispatched: any[] = [];

  for (const w of WINDOWS) {
    const center = new Date(now + w.min * 60_000);
    const lo = new Date(center.getTime() - w.tolerance * 60_000).toISOString();
    const hi = new Date(center.getTime() + w.tolerance * 60_000).toISOString();

    const { data: sessions } = await sb
      .from("course_sessions")
      .select("id")
      .gte("scheduled_date", lo)
      .lte("scheduled_date", hi)
      .in("status", ["scheduled", "ongoing"]);

    for (const s of sessions ?? []) {
      // Skip if already dispatched
      const { data: existing } = await sb
        .from("notification_dispatch")
        .select("id")
        .eq("scope", "session").eq("scope_id", s.id).eq("kind", w.kind)
        .maybeSingle();
      if (existing) continue;

      const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-learning-event`;
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ kind: w.kind, session_id: s.id }),
      });
      dispatched.push({ session_id: s.id, kind: w.kind });
    }
  }

  // Recording-ready dispatch (drained from notification_dispatch trigger marker)
  // Trigger inserts row with kind='recording_ready'; we forward to notify fn for users.
  const { data: pending } = await sb
    .from("notification_dispatch")
    .select("scope_id,payload")
    .eq("scope", "session").eq("kind", "recording_ready")
    .gte("dispatched_at", new Date(now - 60 * 60_000).toISOString());

  for (const r of pending ?? []) {
    // Skip if already fanned out (reuse a sibling kind marker)
    const { data: fan } = await sb.from("notification_dispatch")
      .select("id").eq("scope", "session").eq("scope_id", r.scope_id)
      .eq("kind", "recording_ready_fanned").maybeSingle();
    if (fan) continue;

    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-learning-event`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ kind: "recording_ready", session_id: r.scope_id, payload: r.payload }),
    });
    await sb.from("notification_dispatch").insert({
      scope: "session", scope_id: r.scope_id, kind: "recording_ready_fanned",
    });
  }

  return new Response(JSON.stringify({ ok: true, dispatched }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
