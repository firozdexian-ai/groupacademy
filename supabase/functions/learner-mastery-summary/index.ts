// learner-mastery-summary (2.6.a)
// Read-only aggregation over talent_skill_profile, talent_quiz_attempt,
// and talent_scenario_run for the Adaptive Snapshot dashboard widget.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const dayKey = (iso: string) => iso.slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json(401, { error: "Unauthorized" });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json(401, { error: "Unauthorized" });

    const { data: talent } = await sb
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!talent) return json(403, { error: "Not a talent" });

    const body = await req.json().catch(() => ({}));
    const moduleId: string | undefined = typeof body.module_id === "string" ? body.module_id : undefined;
    const contentId: string | undefined = typeof body.content_id === "string" ? body.content_id : undefined;
    const days = Math.min(Math.max(Number(body.days ?? 7), 1), 30);

    // 1. Skill profile rows
    let pq = sb
      .from("talent_skill_profile")
      .select("module_id, content_id, topic_tag, mastery, due_at, last_source")
      .eq("talent_id", talent.id);
    if (moduleId) pq = pq.eq("module_id", moduleId);
    if (contentId) pq = pq.eq("content_id", contentId);

    const { data: profileData, error: profileErr } = await pq;
    if (profileErr) return json(500, { error: profileErr.message });

    const profiles = profileData ?? [];
    const nowIso = new Date().toISOString();
    const trackedTopics = profiles.length;
    const avgMastery = trackedTopics > 0
      ? profiles.reduce((s, p) => s + Number(p.mastery ?? 0), 0) / trackedTopics
      : 0;
    const due = profiles.filter((p) => p.due_at && p.due_at <= nowIso);
    const upcoming = profiles
      .filter((p) => p.due_at && p.due_at > nowIso)
      .sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1));
    const nextDueAt = upcoming[0]?.due_at ?? null;

    // 2. Module title lookup
    const moduleIds = [...new Set(profiles.map((p) => p.module_id).filter(Boolean) as string[])];
    const { data: moduleMeta } = moduleIds.length
      ? await sb.from("course_modules").select("id, title").in("id", moduleIds)
      : { data: [] as Array<{ id: string; title: string }> };
    const moduleTitleById = new Map<string, string>();
    for (const m of moduleMeta ?? []) moduleTitleById.set(m.id as string, (m.title as string) ?? "");

    const enrich = (p: typeof profiles[number]) => ({
      module_id: p.module_id,
      module_title: moduleTitleById.get(p.module_id ?? "") ?? null,
      topic_tag: p.topic_tag,
      mastery: Number(p.mastery ?? 0),
      due_at: p.due_at,
    });
    const sortedAsc = [...profiles].sort((a, b) => Number(a.mastery ?? 0) - Number(b.mastery ?? 0));
    const weakest = sortedAsc.slice(0, 3).map(enrich);
    const strongest = sortedAsc.slice(-3).reverse().map(enrich);

    // 3. Activity windows
    const sparkSince = new Date(Date.now() - days * 86_400_000).toISOString();
    const splitSince = new Date(Date.now() - 30 * 86_400_000).toISOString();

    let qq = sb
      .from("talent_quiz_attempt")
      .select("created_at, module_id")
      .eq("talent_id", talent.id)
      .gte("created_at", splitSince);
    if (moduleId) qq = qq.eq("module_id", moduleId);

    let sq = sb
      .from("talent_scenario_run")
      .select("created_at, module_id, evaluation")
      .eq("talent_id", talent.id)
      .gte("created_at", splitSince);
    if (moduleId) sq = sq.eq("module_id", moduleId);

    const [{ data: quizRows }, { data: scenarioRows }] = await Promise.all([qq, sq]);

    const quizAll = quizRows ?? [];
    const scenarioAll = (scenarioRows ?? []).filter((r: any) => r.evaluation);
    const signalSplit30d = { quiz: quizAll.length, scenario: scenarioAll.length };

    // 4. Sparkline (last `days` days, oldest → newest)
    const buckets = new Map<string, { quiz: number; scenario: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      buckets.set(d, { quiz: 0, scenario: 0 });
    }
    for (const r of quizAll) {
      const k = dayKey(r.created_at as string);
      if (k >= sparkSince.slice(0, 10) && buckets.has(k)) buckets.get(k)!.quiz += 1;
    }
    for (const r of scenarioAll) {
      const k = dayKey(r.created_at as string);
      if (k >= sparkSince.slice(0, 10) && buckets.has(k)) buckets.get(k)!.scenario += 1;
    }
    const sparkline = [...buckets.entries()].map(([date, v]) => ({ date, ...v }));

    return json(200, {
      totals: {
        tracked_topics: trackedTopics,
        avg_mastery: Number(avgMastery.toFixed(3)),
        due_now: due.length,
        next_due_at: nextDueAt,
      },
      weakest,
      strongest,
      signal_split_30d: signalSplit30d,
      sparkline,
      now: nowIso,
    });
  } catch (e) {
    console.error("learner-mastery-summary error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown" });
  }
});
