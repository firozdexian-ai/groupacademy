// Cron-gig-matchmaker — Phase G1 rebuild.
// - Drops the 24h filter for active gigs that have ZERO matches (cold-start backfill).
// - Parallelizes refresh_gig_matches calls in batches of 10.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1) Recently updated open gigs (regular cadence)
    const { data: recent } = await supabase
      .from("gigs_unified_view")
      .select("id, kind, status, updated_at")
      .in("status", ["active", "approved", "pending"])
      .gte("updated_at", since)
      .limit(200);

    // 2) Cold-start: any active gig with ZERO matches yet (no time filter)
    const { data: matched } = await supabase
      .from("gig_matches")
      .select("gig_id");
    const matchedIds = new Set((matched ?? []).map((m: any) => m.gig_id));

    const { data: allActive } = await supabase
      .from("gigs_unified_view")
      .select("id, kind, status")
      .in("status", ["active", "approved", "pending"])
      .limit(1000);

    const cold = (allActive ?? []).filter((g: any) => !matchedIds.has(g.id));

    // Merge & dedupe
    const map = new Map<string, { id: string; kind: string }>();
    for (const g of [...(recent ?? []), ...cold]) {
      map.set((g as any).id, { id: (g as any).id, kind: (g as any).kind });
    }
    const queue = Array.from(map.values());

    const results: any[] = [];
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      const slice = queue.slice(i, i + BATCH_SIZE);
      const batch = await Promise.allSettled(
        slice.map((g) =>
          supabase.rpc("refresh_gig_matches", {
            _gig_id: g.id,
            _gig_kind: g.kind,
            _limit: 25,
          }),
        ),
      );
      batch.forEach((b, idx) => {
        if (b.status === "fulfilled") {
          results.push({ gig_id: slice[idx].id, kind: slice[idx].kind, matched: (b.value as any)?.data });
        } else {
          results.push({ gig_id: slice[idx].id, kind: slice[idx].kind, error: String(b.reason) });
        }
      });
    }

    return new Response(
      JSON.stringify({ processed: queue.length, recent: recent?.length ?? 0, cold: cold.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
