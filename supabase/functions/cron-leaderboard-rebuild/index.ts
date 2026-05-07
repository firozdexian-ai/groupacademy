// Recomputes leaderboard_snapshots for talents, companies, reviewers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const periods: Array<"weekly"|"monthly"|"alltime"> = ["weekly","monthly","alltime"];
  const cutoff = (p: string) => p==="weekly" ? "now() - interval '7 days'" : p==="monthly" ? "now() - interval '30 days'" : "'1970-01-01'::timestamptz";

  const out: Record<string, unknown> = {};
  for (const period of periods) {
    // Talent leaderboard: trust + completed + escrow
    const { data: talents } = await admin.rpc("execute_sql" as never, {} as never).catch(() => ({ data: null }));
    // Use targeted queries instead of raw SQL.
    const sinceDays = period === "weekly" ? 7 : period === "monthly" ? 30 : 365 * 10;
    const sinceISO = new Date(Date.now() - sinceDays * 86400000).toISOString();

    // ---- Talents ----
    const { data: trust } = await admin.from("talent_trust_score").select("talent_id, score").order("score", { ascending: false }).limit(200);
    const talentRanks: Array<{ talent_id: string; score: number; trust: number; completed: number }> = [];
    for (const t of trust ?? []) {
      const { count: completed } = await admin
        .from("gig_project_assignments")
        .select("id", { count: "exact", head: true })
        .eq("talent_id", t.talent_id).eq("status", "accepted")
        .gte("accepted_at", sinceISO);
      talentRanks.push({ talent_id: t.talent_id, trust: Number(t.score), completed: completed ?? 0, score: 0 });
    }
    talentRanks.forEach(r => { r.score = 0.7 * r.trust + 0.3 * Math.min(r.completed * 10, 100); });
    talentRanks.sort((a,b)=>b.score-a.score);
    const topTalents = talentRanks.slice(0, 50);
    const tIds = topTalents.map(r => r.talent_id);
    const { data: tProfiles } = await admin.from("talents").select("id, full_name, public_handle, profile_photo_url").in("id", tIds);
    const tMap = new Map((tProfiles ?? []).map(p => [p.id, p]));
    const talentPayload = topTalents.map((r, i) => ({
      rank: i + 1, talent_id: r.talent_id, score: Math.round(r.score * 100) / 100,
      trust: r.trust, completed: r.completed,
      ...(tMap.get(r.talent_id) || {}),
    }));
    await admin.from("leaderboard_snapshots").delete().eq("kind", "talent").eq("period", period).is("category", null);
    await admin.from("leaderboard_snapshots").insert({ kind: "talent", period, category: null, payload: talentPayload });

    // ---- Companies ----
    const { data: projects } = await admin
      .from("gig_projects").select("company_id, status, updated_at")
      .gte("updated_at", sinceISO);
    const companyAgg = new Map<string, { completed: number; active: number }>();
    for (const p of projects ?? []) {
      const c = companyAgg.get(p.company_id) || { completed: 0, active: 0 };
      if (p.status === "completed") c.completed++;
      if (p.status === "active" || p.status === "funded") c.active++;
      companyAgg.set(p.company_id, c);
    }
    const cRows = Array.from(companyAgg.entries())
      .map(([company_id, v]) => ({ company_id, ...v, score: v.completed * 3 + v.active }))
      .sort((a,b)=>b.score-a.score).slice(0, 50);
    const cIds = cRows.map(r => r.company_id);
    const { data: cProfiles } = await admin.from("companies").select("id, name, slug, logo_url").in("id", cIds);
    const cMap = new Map((cProfiles ?? []).map(p => [p.id, p]));
    const companyPayload = cRows.map((r, i) => ({ rank: i + 1, ...r, ...(cMap.get(r.company_id) || {}) }));
    await admin.from("leaderboard_snapshots").delete().eq("kind", "company").eq("period", period).is("category", null);
    await admin.from("leaderboard_snapshots").insert({ kind: "company", period, category: null, payload: companyPayload });

    // ---- Reviewers ----
    const { data: revs } = await admin.from("reviewer_profiles")
      .select("talent_id, tier, accuracy, items_resolved")
      .order("accuracy", { ascending: false }).limit(50);
    const rIds = (revs ?? []).map(r => r.talent_id);
    const { data: rProfiles } = await admin.from("talents").select("id, full_name, public_handle, profile_photo_url").in("id", rIds);
    const rMap = new Map((rProfiles ?? []).map(p => [p.id, p]));
    const tierWeight: Record<string, number> = { master: 1.0, expert: 0.8, journey: 0.6, apprentice: 0.4 };
    const reviewerPayload = (revs ?? []).map((r, i) => ({
      rank: i + 1, talent_id: r.talent_id, tier: r.tier,
      accuracy: r.accuracy, items_resolved: r.items_resolved,
      score: Math.round(((r.accuracy ?? 0) * 0.6 + (tierWeight[r.tier] ?? 0.4) * 40) * 100) / 100,
      ...(rMap.get(r.talent_id) || {}),
    }));
    await admin.from("leaderboard_snapshots").delete().eq("kind", "reviewer").eq("period", period).is("category", null);
    await admin.from("leaderboard_snapshots").insert({ kind: "reviewer", period, category: null, payload: reviewerPayload });

    out[period] = { talents: talentPayload.length, companies: companyPayload.length, reviewers: reviewerPayload.length };
  }

  return new Response(JSON.stringify({ ok: true, out }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
