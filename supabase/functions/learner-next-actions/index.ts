// Next-Best-Action recommender — returns 3-5 ranked actions for the authenticated talent.
// Phase 3.1.a — read-only over talent_skill_profile, enrollments, course_modules, module_scenario_pool.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type ActionType =
  | "review_due"
  | "practice_weakness"
  | "finish_module"
  | "take_scenario";

interface NextAction {
  type: ActionType;
  score: number;
  title: string;
  reason: string;
  cta: string;          // route
  cta_label: string;
  course_id?: string;
  module_id?: string;
  topic_tag?: string;
  count?: number;
}

const TYPE_WEIGHT: Record<ActionType, number> = {
  review_due: 1.0,
  practice_weakness: 0.7,
  take_scenario: 0.55,
  finish_module: 0.5,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401);

  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: ud, error: ue } = await userClient.auth.getUser(token);
  if (ue || !ud?.user) return json({ error: "unauthenticated" }, 401);

  const admin = createClient(url, service);
  const { data: talent } = await admin.from("talents").select("id").eq("user_id", ud.user.id).maybeSingle();
  if (!talent) return json({ error: "no_talent" }, 404);

  // Pull skill profile + enrollments
  const [{ data: profiles = [] }, { data: enrolls = [] }] = await Promise.all([
    admin.from("talent_skill_profile")
      .select("content_id,module_id,topic_tag,mastery,due_at,attempts")
      .eq("talent_id", talent.id),
    admin.from("enrollments")
      .select("content_id,status,progress")
      .eq("talent_id", talent.id)
      .in("status", ["active", "pending_payment"]),
  ]);

  const now = Date.now();
  const actions: NextAction[] = [];

  // Lookups
  const moduleIds = Array.from(new Set((profiles ?? []).map(p => p.module_id)));
  const contentIds = Array.from(new Set([
    ...((profiles ?? []).map(p => p.content_id)),
    ...((enrolls ?? []).map((e: any) => e.content_id)),
  ]));
  const [{ data: modules = [] }, { data: contents = [] }] = await Promise.all([
    moduleIds.length
      ? admin.from("course_modules").select("id,title,content_id").in("id", moduleIds)
      : Promise.resolve({ data: [] as any[] }),
    contentIds.length
      ? admin.from("content").select("id,title,slug").in("id", contentIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const moduleById = new Map((modules ?? []).map((m: any) => [m.id, m]));
  const contentById = new Map((contents ?? []).map((c: any) => [c.id, c]));

  // 1. Review due — single bundled action
  const dueProfiles = (profiles ?? []).filter(p => p.due_at && new Date(p.due_at).getTime() <= now);
  if (dueProfiles.length > 0) {
    const overdueDays = Math.max(
      0,
      Math.round((now - Math.min(...dueProfiles.map(p => new Date(p.due_at).getTime()))) / 86400_000),
    );
    actions.push({
      type: "review_due",
      score: TYPE_WEIGHT.review_due + Math.min(overdueDays * 0.05, 0.5),
      title: `${dueProfiles.length} topic${dueProfiles.length === 1 ? "" : "s"} due for review`,
      reason: overdueDays > 0 ? `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue` : "Strike while it's fresh",
      cta: "/app/learning/review",
      cta_label: "Start review",
      count: dueProfiles.length,
    });
  }

  // 2. Practice weakness — pick weakest topic per course (cap to 2 across courses)
  const weakByCourse = new Map<string, typeof profiles[number]>();
  for (const p of profiles ?? []) {
    if (Number(p.mastery) >= 0.4) continue;
    const cur = weakByCourse.get(p.content_id);
    if (!cur || Number(p.mastery) < Number(cur.mastery)) weakByCourse.set(p.content_id, p);
  }
  const weakSorted = Array.from(weakByCourse.values()).sort((a, b) => Number(a.mastery) - Number(b.mastery));
  for (const p of weakSorted.slice(0, 2)) {
    const m = moduleById.get(p.module_id);
    const c = contentById.get(p.content_id);
    actions.push({
      type: "practice_weakness",
      score: TYPE_WEIGHT.practice_weakness + (1 - Number(p.mastery)) * 0.4,
      title: `Practice ${p.topic_tag.replace(/_/g, " ")}`,
      reason: `Your weakest topic in ${c?.title ?? "this course"} (${Math.round(Number(p.mastery) * 100)}% mastery)`,
      cta: m ? `/learn/${m.id}/quiz` : "/app/learning?tab=my-courses",
      cta_label: "Quick quiz",
      course_id: p.content_id,
      module_id: p.module_id,
      topic_tag: p.topic_tag,
    });
  }

  // 3. Finish module — for active enrollments with progress in (0, 1)
  const inProgress = (enrolls ?? []).filter((e: any) =>
    typeof e.progress === "number" && e.progress > 0 && e.progress < 1,
  ).sort((a: any, b: any) => b.progress - a.progress).slice(0, 1);
  for (const e of inProgress) {
    const c = contentById.get(e.content_id);
    if (!c) continue;
    actions.push({
      type: "finish_module",
      score: TYPE_WEIGHT.finish_module + Number(e.progress) * 0.3,
      title: `Continue ${c.title}`,
      reason: `${Math.round(Number(e.progress) * 100)}% complete — keep the streak`,
      cta: `/content/${c.slug ?? c.id}`,
      cta_label: "Continue",
      course_id: e.content_id,
    });
  }

  // 4. Take scenario — find a scenario in a module where mastery is in 0.6–0.85 (close to mastery)
  const midMastery = (profiles ?? []).filter(p => {
    const m = Number(p.mastery);
    return m >= 0.55 && m < 0.85;
  });
  const moduleIdsForScenario = Array.from(new Set(midMastery.map(p => p.module_id))).slice(0, 5);
  if (moduleIdsForScenario.length > 0) {
    const { data: scenarios = [] } = await admin
      .from("module_scenario_pool")
      .select("id,title,module_id,topic_tags")
      .in("module_id", moduleIdsForScenario)
      .limit(20);
    const pickedModules = new Set<string>();
    for (const s of scenarios ?? []) {
      if (pickedModules.has(s.module_id)) continue;
      pickedModules.add(s.module_id);
      const profile = midMastery.find(p => p.module_id === s.module_id);
      const m = moduleById.get(s.module_id);
      actions.push({
        type: "take_scenario",
        score: TYPE_WEIGHT.take_scenario + (profile ? (0.85 - Number(profile.mastery)) * 0.5 : 0.1),
        title: `Try the "${s.title}" scenario`,
        reason: `You're close to mastery in ${m?.title ?? "this module"} — practice under pressure`,
        cta: m ? `/learn/${m.id}/scenario` : "/app/learning?tab=my-courses",
        cta_label: "Run scenario",
        module_id: s.module_id,
        course_id: m?.content_id,
      });
      if (pickedModules.size >= 2) break;
    }
  }

  // Diversify across courses where possible, then cap to 5
  actions.sort((a, b) => b.score - a.score);
  const seenCourses = new Set<string>();
  const final: NextAction[] = [];
  for (const a of actions) {
    if (a.course_id && seenCourses.has(a.course_id) && final.length >= 3) continue;
    final.push(a);
    if (a.course_id) seenCourses.add(a.course_id);
    if (final.length >= 5) break;
  }

  return json({
    talent_id: talent.id,
    actions: final,
    counts: {
      due_now: dueProfiles.length,
      tracked_topics: profiles?.length ?? 0,
      active_enrollments: enrolls?.length ?? 0,
    },
  });
});
