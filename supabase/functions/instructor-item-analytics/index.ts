// Instructor item-bank analytics — aggregates per-module quiz/scenario telemetry
// Phase 2.7.a — admin-gated read aggregation, no schema changes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Body {
  module_id?: string;
  days?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);
  const uid = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) return json({ error: "forbidden" }, 403);

  let body: Body = {};
  try { body = await req.json(); } catch { /* default */ }
  const moduleId = body.module_id;
  if (!moduleId) return json({ error: "module_id required" }, 400);
  const days = Math.min(Math.max(body.days ?? 30, 1), 90);
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const staleCutoff = new Date(Date.now() - 14 * 86400_000);

  // Module info
  const { data: moduleRow } = await admin
    .from("course_modules")
    .select("id,title,content_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!moduleRow) return json({ error: "module_not_found" }, 404);

  // Pools
  const [{ data: quizPool = [] }, { data: scenarioPool = [] }] = await Promise.all([
    admin.from("module_quiz_pool")
      .select("id,question,options,correct_index,difficulty,topic_tags,quality_score,times_served,times_correct,created_at")
      .eq("module_id", moduleId),
    admin.from("module_scenario_pool")
      .select("id,title,rubric,difficulty,topic_tags,quality_score,times_served,created_at")
      .eq("module_id", moduleId),
  ]);

  // Window: quiz attempts
  const { data: attempts = [] } = await admin
    .from("talent_quiz_attempt")
    .select("item_ids,answers,created_at")
    .eq("module_id", moduleId)
    .gte("created_at", since);

  const quizCorrectIndex = new Map<string, number>();
  for (const q of quizPool ?? []) quizCorrectIndex.set(q.id, q.correct_index);

  const winServed = new Map<string, number>();
  const winCorrect = new Map<string, number>();
  for (const a of attempts ?? []) {
    const ids: string[] = a.item_ids ?? [];
    const ans: any[] = Array.isArray(a.answers) ? a.answers : [];
    ids.forEach((iid, i) => {
      winServed.set(iid, (winServed.get(iid) ?? 0) + 1);
      const correct = quizCorrectIndex.get(iid);
      const picked = ans[i]?.selected_index ?? ans[i]?.selected ?? ans[i];
      if (correct !== undefined && picked === correct) {
        winCorrect.set(iid, (winCorrect.get(iid) ?? 0) + 1);
      }
    });
  }

  // Window: scenario runs
  const { data: runs = [] } = await admin
    .from("talent_scenario_run")
    .select("scenario_id,evaluation,created_at")
    .gte("created_at", since)
    .in("scenario_id", (scenarioPool ?? []).map((s: any) => s.id));

  const runsByScenario = new Map<string, { count: number; overallSum: number; rubric: Record<string, { sum: number; n: number }> }>();
  for (const r of runs ?? []) {
    if (!r.scenario_id) continue;
    const ev = r.evaluation ?? {};
    const overall = Number(ev?.overall_score ?? 0);
    const slot = runsByScenario.get(r.scenario_id) ?? { count: 0, overallSum: 0, rubric: {} };
    slot.count += 1;
    slot.overallSum += isFinite(overall) ? overall : 0;
    const perR = ev?.per_rubric ?? ev?.rubric_scores ?? {};
    if (perR && typeof perR === "object") {
      for (const [k, v] of Object.entries(perR)) {
        const num = Number((v as any)?.score ?? v);
        if (!isFinite(num)) continue;
        const cell = slot.rubric[k] ?? { sum: 0, n: 0 };
        cell.sum += num; cell.n += 1;
        slot.rubric[k] = cell;
      }
    }
    runsByScenario.set(r.scenario_id, slot);
  }

  // Build quiz item rows
  const quizItems = (quizPool ?? []).map((q: any) => {
    const lifeServed = q.times_served ?? 0;
    const lifeCorrect = q.times_correct ?? 0;
    const pLife = lifeServed > 0 ? lifeCorrect / lifeServed : null;
    const wServed = winServed.get(q.id) ?? 0;
    const wCorrect = winCorrect.get(q.id) ?? 0;
    const pWin = wServed > 0 ? wCorrect / wServed : null;
    const flags: string[] = [];
    if (pLife !== null && pLife < 0.25 && lifeServed >= 3) flags.push("low_p_value");
    if (pLife !== null && pLife > 0.95 && lifeServed >= 5) flags.push("trivial");
    if (lifeServed < 3 && new Date(q.created_at) < staleCutoff) flags.push("stale");
    if (q.difficulty === "easy" && pLife !== null && pLife < 0.4) flags.push("miscalibrated");
    if (q.difficulty === "hard" && pLife !== null && pLife > 0.85) flags.push("miscalibrated");
    return {
      id: q.id,
      question: q.question,
      topic_tags: q.topic_tags ?? [],
      difficulty: q.difficulty,
      quality_score: Number(q.quality_score ?? 0),
      serves_lifetime: lifeServed,
      correct_lifetime: lifeCorrect,
      p_value: pLife,
      serves_window: wServed,
      p_value_window: pWin,
      needs_review: flags,
    };
  });

  const scenarioItems = (scenarioPool ?? []).map((s: any) => {
    const slot = runsByScenario.get(s.id);
    const runsLife = s.times_served ?? 0;
    const runsWin = slot?.count ?? 0;
    const avgOverall = slot && slot.count > 0 ? slot.overallSum / slot.count : null;
    const perRubric: Record<string, number> = {};
    if (slot) for (const [k, v] of Object.entries(slot.rubric)) perRubric[k] = v.sum / Math.max(v.n, 1);
    const flags: string[] = [];
    if (avgOverall !== null && avgOverall < 0.3 && runsWin >= 3) flags.push("low_rubric");
    if (runsLife < 1 && new Date(s.created_at) < staleCutoff) flags.push("stale");
    return {
      id: s.id,
      title: s.title,
      topic_tags: s.topic_tags ?? [],
      difficulty: s.difficulty,
      runs_lifetime: runsLife,
      runs_window: runsWin,
      avg_overall: avgOverall,
      avg_per_rubric: perRubric,
      needs_review: flags,
    };
  });

  // Topic rollup
  const topicAgg = new Map<string, { items: number; pSum: number; pN: number; sSum: number; sN: number }>();
  const bumpTopic = (tag: string, p?: number | null, s?: number | null) => {
    const cell = topicAgg.get(tag) ?? { items: 0, pSum: 0, pN: 0, sSum: 0, sN: 0 };
    cell.items += 1;
    if (p !== null && p !== undefined) { cell.pSum += p; cell.pN += 1; }
    if (s !== null && s !== undefined) { cell.sSum += s; cell.sN += 1; }
    topicAgg.set(tag, cell);
  };
  for (const q of quizItems) for (const t of q.topic_tags) bumpTopic(t, q.p_value, null);
  for (const s of scenarioItems) for (const t of s.topic_tags) bumpTopic(t, null, s.avg_overall);

  // Learner mastery per topic
  const tags = Array.from(topicAgg.keys());
  let masteryByTag = new Map<string, { sum: number; n: number }>();
  if (tags.length) {
    const { data: profileRows = [] } = await admin
      .from("talent_skill_profile")
      .select("topic_tag,mastery")
      .eq("module_id", moduleId)
      .in("topic_tag", tags);
    for (const r of profileRows ?? []) {
      const cell = masteryByTag.get(r.topic_tag) ?? { sum: 0, n: 0 };
      cell.sum += Number(r.mastery ?? 0); cell.n += 1;
      masteryByTag.set(r.topic_tag, cell);
    }
  }

  const topics = Array.from(topicAgg.entries()).map(([tag, c]) => {
    const m = masteryByTag.get(tag);
    return {
      topic_tag: tag,
      items: c.items,
      avg_p_value: c.pN > 0 ? c.pSum / c.pN : null,
      avg_scenario_score: c.sN > 0 ? c.sSum / c.sN : null,
      learner_mastery_mean: m && m.n > 0 ? m.sum / m.n : null,
    };
  }).sort((a, b) => (a.avg_p_value ?? 1) - (b.avg_p_value ?? 1));

  const pVals = quizItems.map(q => q.p_value).filter((x): x is number => x !== null);
  const sVals = scenarioItems.map(s => s.avg_overall).filter((x): x is number => x !== null);

  const summary = {
    quiz_items: quizItems.length,
    scenario_items: scenarioItems.length,
    avg_p_value: pVals.length ? pVals.reduce((a, b) => a + b, 0) / pVals.length : null,
    avg_scenario_score: sVals.length ? sVals.reduce((a, b) => a + b, 0) / sVals.length : null,
    items_needing_review:
      quizItems.filter(q => q.needs_review.length > 0).length +
      scenarioItems.filter(s => s.needs_review.length > 0).length,
    window_days: days,
  };

  return json({
    module: { id: moduleRow.id, title: moduleRow.title, content_id: moduleRow.content_id },
    summary,
    quiz_items: quizItems.sort((a, b) => (a.p_value ?? 2) - (b.p_value ?? 2)),
    scenario_items: scenarioItems.sort((a, b) => (a.avg_overall ?? 2) - (b.avg_overall ?? 2)),
    topics,
  });
});
