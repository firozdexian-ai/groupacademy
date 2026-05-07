// Phase 4.5 — Daily sweep: overdue + due-soon (hardened)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // 1. CRON_SECRET gate — block public/anonymous invocations
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    return json({ error: "CRON_SECRET not configured" }, 500);
  }
  const provided =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const nowIso = now.toISOString();
    const in72h = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
    // Dedup window: don't re-notify due_soon within 48h
    const dedupCutoff = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();

    // 2. Mark overdue
    const { data: overdueRows, error: overdueErr } = await supabase
      .from("learning_track_assignments")
      .update({ status: "overdue" })
      .lt("due_at", nowIso)
      .in("status", ["active", "invited"])
      .select("id, user_id");

    if (overdueErr) throw new Error(`overdue update: ${overdueErr.message}`);

    // 3. Due soon (next 72h) — skip rows already notified within dedup window
    const { data: dueSoon, error: dueSoonErr } = await supabase
      .from("learning_track_assignments")
      .select("id, user_id, due_at, last_due_soon_notified_at")
      .gte("due_at", nowIso)
      .lte("due_at", in72h)
      .in("status", ["active", "invited"])
      .or(`last_due_soon_notified_at.is.null,last_due_soon_notified_at.lt.${dedupCutoff}`);

    if (dueSoonErr) throw new Error(`due_soon select: ${dueSoonErr.message}`);

    // 4. Fan out notifications with Promise.allSettled
    const overdueResults = await Promise.allSettled(
      (overdueRows ?? []).map((r) => fireNotify(r.id, "overdue")),
    );

    const dueSoonResults = await Promise.allSettled(
      (dueSoon ?? []).map((r) => fireNotify(r.id, "due_soon")),
    );

    // 5. Stamp dedup column for successfully-notified due_soon rows
    const notifiedIds = (dueSoon ?? [])
      .filter((_, i) => dueSoonResults[i].status === "fulfilled")
      .map((r) => r.id);

    if (notifiedIds.length > 0) {
      const { error: stampErr } = await supabase
        .from("learning_track_assignments")
        .update({ last_due_soon_notified_at: nowIso })
        .in("id", notifiedIds);
      if (stampErr) console.error("[cron-track-sweeps] dedup stamp failed:", stampErr.message);
    }

    const summary = {
      ok: true,
      overdue: { total: overdueRows?.length ?? 0, ...tally(overdueResults) },
      due_soon: { total: dueSoon?.length ?? 0, ...tally(dueSoonResults) },
    };
    console.log("[cron-track-sweeps] summary:", JSON.stringify(summary));
    return json(summary, 200);
  } catch (err: any) {
    console.error("[cron-track-sweeps] FATAL:", err?.message || err);
    return json({ ok: false, error: err?.message || String(err) }, 500);
  }
});

function tally(results: PromiseSettledResult<unknown>[]) {
  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .slice(0, 5)
    .map((r) => String(r.reason));
  return { sent, failed, errors };
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fireNotify(assignment_id: string, kind: string) {
  const res = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-track-event`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ assignment_id, kind }),
    },
  );
  if (!res.ok) {
    throw new Error(`notify-track-event ${kind} ${assignment_id} -> ${res.status}`);
  }
}
