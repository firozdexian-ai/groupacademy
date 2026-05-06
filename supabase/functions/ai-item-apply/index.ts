// Apply an AI item rewrite — phase 3.7
// Validates patch, updates the pool row, resets serve counters, logs revision.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const clamp = (s: any, max: number) =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);
  const uid = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: role } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  if (!role) return json({ error: "forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* */ }
  const kind: "quiz" | "scenario" = body?.kind;
  const itemId: string = body?.item_id;
  const patch = body?.patch ?? {};
  const flagsAddressed: string[] = Array.isArray(body?.flags_addressed) ? body.flags_addressed : [];
  if (!itemId || !["quiz", "scenario"].includes(kind)) return json({ error: "bad_request" }, 400);

  if (kind === "quiz") {
    const { data: before } = await admin.from("module_quiz_pool").select("*").eq("id", itemId).maybeSingle();
    if (!before) return json({ error: "item_not_found" }, 404);

    const question = clamp(patch.question, 600);
    const explanation = clamp(patch.explanation, 600);
    const options = Array.isArray(patch.options) ? patch.options.slice(0, 4).map((o: any) => clamp(o, 200)) : [];
    const correct_index = Number.isInteger(patch.correct_index) ? patch.correct_index : -1;
    const difficulty = ["easy", "medium", "hard"].includes(patch.difficulty) ? patch.difficulty : (before as any).difficulty;
    if (!question) return json({ error: "invalid_question" }, 400);
    if (options.length !== 4 || options.some((o: string) => !o)) return json({ error: "invalid_options" }, 400);
    if (correct_index < 0 || correct_index > 3) return json({ error: "invalid_correct_index" }, 400);

    const after = {
      question, options, correct_index,
      explanation: explanation || (before as any).explanation,
      difficulty,
      times_served: 0, times_correct: 0, quality_score: 0,
    };
    const { error: upErr } = await admin.from("module_quiz_pool").update(after).eq("id", itemId);
    if (upErr) return json({ error: upErr.message }, 500);

    const { data: rev } = await admin.from("module_item_revision_log").insert({
      item_id: itemId, kind: "quiz", module_id: (before as any).module_id,
      before, after: { ...before, ...after },
      flags_addressed: flagsAddressed, applied_by: uid,
    }).select("id").maybeSingle();
    return json({ ok: true, item_id: itemId, revision_id: (rev as any)?.id ?? null });
  }

  // scenario
  const { data: before } = await admin.from("module_scenario_pool").select("*").eq("id", itemId).maybeSingle();
  if (!before) return json({ error: "item_not_found" }, 404);

  const title = clamp(patch.title, 200);
  const scenario_prompt = clamp(patch.scenario_prompt, 2000);
  const difficulty = ["easy", "medium", "hard"].includes(patch.difficulty) ? patch.difficulty : (before as any).difficulty;
  const rubricRaw = Array.isArray(patch.rubric) ? patch.rubric : [];
  const rubric = rubricRaw.slice(0, 6).map((r: any) => ({
    criterion: clamp(r?.criterion, 120),
    weight: Math.max(0, Math.min(1, Number(r?.weight) || 0)),
    description: clamp(r?.description, 400),
  })).filter((r: any) => r.criterion);
  if (!title || !scenario_prompt) return json({ error: "invalid_scenario" }, 400);
  if (rubric.length < 2) return json({ error: "rubric_min_2" }, 400);
  const weightSum = rubric.reduce((a: number, r: any) => a + r.weight, 0);
  if (weightSum <= 0) return json({ error: "rubric_zero_weight" }, 400);

  const after = {
    title, scenario_prompt, rubric, difficulty,
    times_served: 0, quality_score: 0,
  };
  const { error: upErr } = await admin.from("module_scenario_pool").update(after).eq("id", itemId);
  if (upErr) return json({ error: upErr.message }, 500);

  const { data: rev } = await admin.from("module_item_revision_log").insert({
    item_id: itemId, kind: "scenario", module_id: (before as any).module_id,
    before, after: { ...before, ...after },
    flags_addressed: flagsAddressed, applied_by: uid,
  }).select("id").maybeSingle();
  return json({ ok: true, item_id: itemId, revision_id: (rev as any)?.id ?? null });
});
