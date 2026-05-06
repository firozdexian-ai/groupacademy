// Phase 4.7 — Monthly instructor statement generator (cron, 1st of month)
// Generates an HTML statement summary per active instructor for the previous month,
// stores metadata in instructor_statements, and notifies the instructor.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const periodMonth = periodStart.toISOString().slice(0, 10);

    // Aggregate per instructor for previous month
    const { data: rows, error } = await supabase
      .from("instructor_earnings_ledger")
      .select("instructor_user_id, source_kind, amount_credits, status")
      .eq("period_month", periodMonth);
    if (error) throw error;

    const byUser = new Map<string, { total: number; byKind: Record<string, number>; count: number }>();
    for (const r of rows ?? []) {
      const u = r.instructor_user_id as string;
      const cur = byUser.get(u) ?? { total: 0, byKind: {}, count: 0 };
      cur.total += Number(r.amount_credits);
      cur.byKind[r.source_kind] = (cur.byKind[r.source_kind] ?? 0) + Number(r.amount_credits);
      cur.count += 1;
      byUser.set(u, cur);
    }

    let generated = 0;
    for (const [user_id, summary] of byUser) {
      const payload = {
        period_month: periodMonth,
        total_credits: Math.round(summary.total * 10) / 10,
        total_bdt: Math.round(summary.total * 2 * 10) / 10,
        line_count: summary.count,
        by_source: summary.byKind,
        generated_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase.from("instructor_statements").upsert({
        instructor_user_id: user_id,
        period_month: periodMonth,
        summary: payload,
        emailed_at: new Date().toISOString(),
      }, { onConflict: "instructor_user_id,period_month" });
      if (upErr) continue;

      await supabase.from("notification_dispatch").insert({
        user_id,
        kind: "instructor.monthly_statement",
        title: `Your earnings statement is ready (${periodMonth.slice(0, 7)})`,
        payload,
      });
      generated++;
    }

    return new Response(JSON.stringify({ ok: true, period_month: periodMonth, generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
